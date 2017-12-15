
# coding: utf-8

import numpy as np
import scipy
import tensorflow as tf
import tensorlayer as tl
import matplotlib.pyplot as plt
from models import *


# ### set up configuration
# optimizer
BATCH_SIZE = 9
dim = 3
LEARNING_RATE = 1e-4
BETA1 = 0.9

## GAN model
N_EPOCH = 2000
LR_DECAY = 0.1
DECAY_FREQ = int(N_EPOCH/2)


# ### read and load image function
def read_images(file_name, file_path):
	return scipy.misc.imread(file_path + file_name, mode='RGB')


def load_images(img_list, file_path):
	imgs = []
	n_threads = 32
	for idx in range(0, len(img_list), n_threads):
		cur_imgs_list = img_list[idx : idx + n_threads]
		cur_imgs = tl.prepro.threading_data(cur_imgs_list, fn = read_images, file_path = file_path)
		# print(cur_imgs.shape)
		imgs.extend(cur_imgs)
		#print('read %d from %s' % (len(imgs), file_path))
	return imgs

def crop_scale_images(x, is_random=True):
	x = tl.prepro.crop(x, wrg=224, hrg=224, is_random=is_random)
	x = x / (255. / 2.)
	x = x - 1.
	return x

def downsample_scale_images(x):
	x = tl.prepro.imresize(x, size=[56, 56], interp='bicubic', mode=None)
	x = x / (255. / 2.)
	x = x - 1.
	return x


# ### define training function

def train(start_epoch = 0):
	train_hr_filepath = 'DIV2K_train_HR/'
	train_lr_filepath = 'DIV2K_train_LR_bicubic/X4/'
	valid_hr_filepath = 'DIV2K_valid_HR/'
	valid_lr_filepath = 'DIV2K_valid_LR_bicubic/X4/'

	# get images sorted by name
	train_hr_img_list = sorted(tl.files.load_file_list(path=train_hr_filepath, regx='.*.png', printable=False))

	# load the whole training hr images
	#train_hr_imgs = load_images(train_hr_img_list, train_hr_filepath)

	#================== define graph model ====================#
	train_lr_image = tf.placeholder('float32', [BATCH_SIZE, 56, 56, 3], name='train_lr_images')
	train_hr_image = tf.placeholder('float32', [BATCH_SIZE, 224, 224, 3], name='train_hr_images')

	# call generator train
	g_out = generator(train_lr_image, is_train=True, reuse=False)
	# call descriminator
	logits_real, network_d = discriminator(train_hr_image, is_train=True, reuse=False)
	logits_fake, _ = discriminator(g_out.outputs, is_train=True, reuse=True)


	# resize image to 224 to fit the pre-trained vgg19 model that used for evaluate the loss, with scale[-1, 1]
	hr_imgs_vgg_loss = tf.image.resize_images(train_hr_image, size=[224, 224]) 
	lr_imgs_vgg_loss = tf.image.resize_images(g_out.outputs, size=[224, 224])

	# scale the images that passed into the vgg19 net, with adjust the scale to [0, 1]
	net_vgg, vgg_feature_maps_real = Vgg19_model((hr_imgs_vgg_loss+1)/2, reuse=False)
	_, vgg_feature_maps_fake = Vgg19_model((lr_imgs_vgg_loss+1)/2, reuse=True)

	# call generator test
	images_out = generator(train_lr_image, is_train=False, reuse=True)

	#=============== define loss and optim ===================#

	d_loss_real = tl.cost.sigmoid_cross_entropy(logits_real, tf.ones_like(logits_real), name='d_real')
	d_loss_fake = tl.cost.sigmoid_cross_entropy(logits_fake, tf.zeros_like(logits_fake), name='d_fake')
	d_loss = d_loss_real + d_loss_fake


	g_gan_loss = 1e-3 * tl.cost.sigmoid_cross_entropy(logits_fake, tf.ones_like(logits_fake), name='adversrial_loss')
	g_vgg_loss = 2e-6 * tl.cost.mean_squared_error(vgg_feature_maps_fake.outputs, vgg_feature_maps_real.outputs, is_mean=True)
	g_mse_loss = tl.cost.mean_squared_error(g_out.outputs , train_hr_image, is_mean=True)

	g_loss = g_mse_loss + g_vgg_loss + g_gan_loss

	# get varibales from models
	g_vars = tl.layers.get_variables_with_name('generator', True, True)
	d_vars = tl.layers.get_variables_with_name('discriminator', True, True)


	with tf.variable_scope('learning_rate'):
	    lr_var = tf.Variable(LEARNING_RATE, trainable=False)

	# AdamOptimizer for two models
	d_optim = tf.train.AdamOptimizer(lr_var, beta1=BETA1).minimize(d_loss, var_list=d_vars)
	g_optim = tf.train.AdamOptimizer(lr_var, beta1=BETA1).minimize(g_loss, var_list=g_vars)


	

	#=================================== train an GAN model =======================================#
	save_dir_g = '/home/tdong/Desktop/learn/project/samples/g_train'
	models_dir_g = '/home/tdong/Desktop/learn/project/saved_models/G'
	models_dir_d = '/home/tdong/Desktop/learn/project/saved_models/D'

	configuration = tf.ConfigProto(allow_soft_placement=True, log_device_placement=False)
	configuration.gpu_options.allocator_type = 'BFC'
	configuration.gpu_options.allow_growth=True

	sess = tf.Session(config=configuration)
	tl.layers.initialize_global_variables(sess)

	# load pre-trained vgg19 network
	
	vgg19_npy_path = "vgg19.npy"
	npz = np.load(vgg19_npy_path, encoding='latin1').item()

	params = []
	for val in sorted( npz.items() ):
		W = np.asarray(val[1][0])
		b = np.asarray(val[1][1])
		print("  Loading %s: %s, %s" % (val[0], W.shape, b.shape))
		params.extend([W, b])
	tl.files.assign_params(sess, params, net_vgg) 
	

	# load the pre-trained initialized generator
	if start_epoch == 0:
		tl.files.load_and_assign_npz(sess=sess, name=models_dir_g+'/g_init_90_init.npz', network=g_out)

	else:
		tl.files.load_and_assign_npz(sess=sess, name=models_dir_g+'/g_train_%d.npz'%start_epoch, network=g_out)

	if start_epoch != 0:
		tl.files.load_and_assign_npz(sess=sess, name=models_dir_d+'/d_train_%d.npz'%start_epoch, network=network_d)


	#===================== train  Generator =================

	
	n_train = len(train_hr_img_list)
	for i in range(start_epoch, N_EPOCH+1):
		# update learning rate
		if i == 0:
			sess.run(tf.assign(lr_var, LEARNING_RATE))
		elif i % DECAY_FREQ == 0:
			sess.run(tf.assign(lr_var, LEARNING_RATE * (LR_DECAY ** (i / DECAY_FREQ))))

		epoch_time_start = time.time()
		total_loss_g = 0 
		total_loss_d = 0
		n_itr = 0

		random.shuffle(train_hr_img_list)
		for idx in range(0, n_train, BATCH_SIZE):
			# for each batch
			batch_time_start = time.time()
			sample_imgs = load_images(train_hr_img_list[idx:idx+BATCH_SIZE], train_hr_filepath)
			if(len(sample_imgs) != BATCH_SIZE):
				continue
			#print('cur batch size: ', len(sample_imgs))
			sample_imgs_hr = tl.prepro.threading_data(sample_imgs, fn=crop_scale_images, is_random=True)
			sample_imgs_lr = tl.prepro.threading_data(sample_imgs_hr, fn=downsample_scale_images)

			# update discriminator (Min)
			cur_loss_d, _ = sess.run([d_loss, d_optim], {train_lr_image: sample_imgs_lr, train_hr_image: sample_imgs_hr})

			# update generator (Max)
			cur_loss_g, _ = sess.run([g_loss, g_optim], {train_lr_image: sample_imgs_lr, train_hr_image: sample_imgs_hr})

			print("Epoch [%2d/%2d] itr:%4d  time: %4.4fs,  batch_d_loss: %.8f " % (i, N_EPOCH, n_itr, time.time() - batch_time_start, cur_loss_d))
			print("Epoch [%2d/%2d] itr:%4d  time: %4.4fs,  batch_g_loss: %.8f " % (i, N_EPOCH, n_itr, time.time() - batch_time_start, cur_loss_g))
			total_loss_d += cur_loss_d
			total_loss_g += cur_loss_g
			n_itr+=1

		print("[***] Epoch: [%2d/%2d] time: %4.4fs, epoch_d_loss: %.8f" % (i, N_EPOCH, time.time() - epoch_time_start, total_loss_d/n_itr))
		print("[***] Epoch: [%2d/%2d] time: %4.4fs, epoch_g_loss: %.8f" % (i, N_EPOCH, time.time() - epoch_time_start, total_loss_g/n_itr))

		#break

		## trainning error
		if i % 10 == 0 and i != start_epoch:
			generated_images = sess.run(images_out.outputs, {train_lr_image: sample_imgs_lr})
			print("[*] save images")
			tl.vis.save_images(generated_images, [dim, dim], save_dir_g+'/train_%d.png' % i)

		## save model
		if i % 10 == 0 and i != start_epoch:
			tl.files.save_npz(g_out.all_params, name=models_dir_g+'/g_train_%d.npz'%i, sess=sess)
			tl.files.save_npz(network_d.all_params, name=models_dir_d+'/d_train_%d.npz'%i, sess=sess)


# ### Main

if __name__ == '__main__':
	device_name = "gpu"
	if device_name == "gpu":
	    device_name = "/gpu:0"
	else:
	    device_name = "/cpu:0"

	with tf.device(device_name):
		train(260)

