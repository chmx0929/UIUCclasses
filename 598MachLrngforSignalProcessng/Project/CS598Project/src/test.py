import numpy as np
import scipy
import tensorflow as tf
import tensorlayer as tl
import matplotlib.pyplot as plt
from models import *

pic_size = 128
BATCH_SIZE = 9
dim = 3

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

def crop_scale_images(x, is_random=True, size=pic_size):
	x = tl.prepro.crop(x, wrg=size, hrg=size, is_random=is_random)
	x = x / (255. / 2.)
	x = x - 1.
	return x





def test(model):
	# load test image file names
	valid_lr_filepath = 'DIV2K_valid_LR_bicubic/X4/'
	valid_hr_filepath = 'DIV2K_valid_HR/'

	#valid_lr_filepath = '/home/tdong/Downloads/load/'

	test_save_dir = '/home/tdong/Desktop/learn/project/samples/test'

	test_lr_img_list = sorted(tl.files.load_file_list(path=valid_lr_filepath, regx='.*.png', printable=False))
	test_hr_img_list = sorted(tl.files.load_file_list(path=valid_hr_filepath, regx='.*.png', printable=False))

	#============================ define generator graph ============================
	test_lr_image = tf.placeholder('float32', [BATCH_SIZE, pic_size, pic_size, 3], name='test_lr_images')
	images_out = generator(test_lr_image, is_train=False, reuse=False)

	#============================ feed test imgaes and test ===========================
	sess = tf.Session()
	tl.layers.initialize_global_variables(sess)

	tl.files.load_and_assign_npz(sess=sess, name=model, network=images_out)


	#random.shuffle(test_lr_img_list)
	sample_test_imgs = load_images(test_lr_img_list[0:BATCH_SIZE], valid_lr_filepath)
	sample_test_imgs = tl.prepro.threading_data(sample_test_imgs, fn=crop_scale_images, is_random=False)

	sample_test_imgs_gt = load_images(test_hr_img_list[0:BATCH_SIZE], valid_hr_filepath)
	sample_test_imgs_gt = tl.prepro.threading_data(sample_test_imgs_gt, fn=crop_scale_images, is_random=False, size=4*pic_size)

	print('==========================================')
	print('==========================================')
	print('==========================================')
	print('==========================================')
	print(sample_test_imgs.shape)
	generated_images = sess.run(images_out.outputs, {test_lr_image: sample_test_imgs})
	print("[*] save images")

	tl.vis.save_images(generated_images, [dim, dim], test_save_dir+'/generated_%d.png' % 0)
	tl.vis.save_images(sample_test_imgs, [dim, dim], test_save_dir+'/input_%d.png' % 0)
	tl.vis.save_images(sample_test_imgs_gt, [dim, dim], test_save_dir+'/real_%d.png' % 0)
	#tl.vis.save_images(generated_images, [dim, dim], test_save_dir+'/test_lr_wecat.png')
	#tl.vis.save_images(sample_test_imgs, [dim, dim], test_save_dir+'/lr_wecat.png')



if __name__ == '__main__':
	device_name = "gpu"
	if device_name == "gpu":
	    device_name = "/gpu:0"
	else:
	    device_name = "/cpu:0"


	model = '/home/tdong/Desktop/learn/project/saved_models/G/g_train_200.npz'
	with tf.device(device_name):
		test(model)
