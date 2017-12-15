
# coding: utf-8

import numpy as np
import scipy
import tensorflow as tf
import tensorlayer as tl
import matplotlib.pyplot as plt
from models import *


# ### set up configuration
# optimizer
BATCH_SIZE = 16
dim = 4
LEARNING_RATE = 1e-4
BETA1 = 0.9

## initialize G
N_EPOCH_INIT = 100


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
    x = tl.prepro.crop(x, wrg=96, hrg=96, is_random=is_random)
    x = x / (255. / 2.)
    x = x - 1.
    return x

def downsample_scale_images(x):
    x = tl.prepro.imresize(x, size=[24, 24], interp='bicubic', mode=None)
    x = x / (255. / 2.)
    x = x - 1.
    return x


# ### define training function

def train():
	train_hr_filepath = 'DIV2K_train_HR/'
	train_lr_filepath = 'DIV2K_train_LR_bicubic/X4/'
	valid_hr_filepath = 'DIV2K_valid_HR/'
	valid_lr_filepath = 'DIV2K_valid_LR_bicubic/X4/'

	# get images sorted by name
	train_hr_img_list = sorted(tl.files.load_file_list(path=train_hr_filepath, regx='.*.png', printable=False))

	# load the whole training hr images
	#train_hr_imgs = load_images(train_hr_img_list, train_hr_filepath)

	#print(train_hr_imgs[0].shape)

	#%matplotlib qt
	#plt.imshow(train_hr_imgs[0])
	#plt.show()

	#================== define model ====================#
	train_lr_image = tf.placeholder('float32', [BATCH_SIZE, 24, 24, 3], name='train_lr_images')
	train_hr_image = tf.placeholder('float32', [BATCH_SIZE, 96, 96, 3], name='train_hr_images')

	# call generator train
	g_out = generator(train_lr_image, is_train=True, reuse=False)

	# get varibales from models
	g_vars = tl.layers.get_variables_with_name('generator', True, True)

	# define loss function
	mse_loss = tl.cost.mean_squared_error(g_out.outputs , train_hr_image, is_mean=True) # is_mean=False to reduce mean


	with tf.variable_scope('learning_rate'):
	    lr_var = tf.Variable(LEARNING_RATE, trainable=False)

	# pretrain to avoid local optima
	g_optim_init = tf.train.AdamOptimizer(lr_var, beta1=BETA1).minimize(mse_loss, var_list=g_vars)


	# call generator test
	images_out = generator(train_lr_image, is_train=False, reuse=True)

	#================== train an initial generative model ====================#
	configuration = tf.ConfigProto(allow_soft_placement=True, log_device_placement=False)
	configuration.gpu_options.allocator_type = 'BFC'
	configuration.gpu_options.allow_growth=True


	sess = tf.Session(config=configuration)

	#sess = tf.Session(config = tf.ConfigProto(allow_soft_placement=True, log_device_placement=False))

	tl.layers.initialize_global_variables(sess)


	# quick check
	sample_imgs = load_images(train_hr_img_list[0: BATCH_SIZE], train_hr_filepath)
	sample_imgs_hr = tl.prepro.threading_data(sample_imgs, fn=crop_scale_images, is_random=False)
	print('sample HR sub-image:',sample_imgs_hr.shape, sample_imgs_hr.min(), sample_imgs_hr.max())
	sample_imgs_lr = tl.prepro.threading_data(sample_imgs_hr, fn=downsample_scale_images)
	print('sample LR sub-image:', sample_imgs_lr.shape, sample_imgs_lr.min(), sample_imgs_lr.max())

	
	#save_dir_ginit = '/home/tdong/Desktop/learn/project/samples/g_init'
	#models_dir = '/home/tdong/Desktop/learn/project/saved_models'

	save_dir_ginit = '/home/tdong/Desktop/learn/project/samples/other'
	models_dir = '/home/tdong/Desktop/learn/project/samples/other'

	tl.vis.save_images(sample_imgs_lr, [dim, dim], save_dir_ginit + '/train_samples_hr.png')
	tl.vis.save_images(sample_imgs_hr, [dim, dim], save_dir_ginit + '/train_samples_lr.png')


	#===================== train init Generator =================

	sess.run(tf.assign(lr_var, LEARNING_RATE))
	n_train = len(train_hr_img_list)
	for i in range(N_EPOCH_INIT):
	    epoch_time_start = time.time()
	    total_mse_loss = 0 
	    n_itr = 0

	    random.shuffle(train_hr_img_list)
	    for idx in range(0, n_train, BATCH_SIZE):
	        # for each batch
	        batch_time_start = time.time()
	        sample_imgs = load_images(train_hr_img_list[idx:idx+BATCH_SIZE], train_hr_filepath)
	        sample_imgs_hr = tl.prepro.threading_data(sample_imgs, fn=crop_scale_images, is_random=True)
	        sample_imgs_lr = tl.prepro.threading_data(sample_imgs_hr, fn=downsample_scale_images)
	        cur_mse_loss, _ = sess.run([mse_loss, g_optim_init], {train_lr_image: sample_imgs_lr, train_hr_image: sample_imgs_hr})
	        print("Epoch [%2d/%2d] %4d time: %4.4fs, mse: %.8f " % (i, N_EPOCH_INIT, n_itr, time.time() - batch_time_start, cur_mse_loss))
	        total_mse_loss += cur_mse_loss
	        n_itr+=1
	    print("[*] Epoch: [%2d/%2d] time: %4.4fs, mse: %.8f" % (i, N_EPOCH_INIT, time.time() - epoch_time_start, total_mse_loss/n_itr))


	    ## trainning error
	    if i % 10 == 0:
	        generated_images = sess.run(images_out.outputs, {train_lr_image: sample_imgs_lr})
	        print("[*] save images")
	        tl.vis.save_images(generated_images, [dim, dim], save_dir_ginit+'/train_%d.png' % i)

	    ## save model
	    if i % 10 == 0:
	        tl.files.save_npz(g_out.all_params, name=models_dir+'/g_init_%d_init.npz'%i, sess=sess)


# ### Main

if __name__ == '__main__':
	device_name = "gpu"
	if device_name == "gpu":
	    device_name = "/gpu:0"
	else:
	    device_name = "/cpu:0"

	with tf.device(device_name):
		train()

