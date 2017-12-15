import numpy as np
import scipy
import tensorflow as tf
import tensorlayer as tl
import matplotlib.pyplot as plt
from models import *



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
    x = tl.prepro.crop(x, wrg=384, hrg=384, is_random=is_random)
    x = x / (255. / 2.)
    x = x - 1.
    return x

def downsample_scale_images(x):
    x = tl.prepro.imresize(x, size=[96, 96], interp='bicubic', mode=None)
    x = x / (255. / 2.)
    x = x - 1.
    return x



BATCH_SIZE=16
train_hr_filepath = 'DIV2K_train_HR/'


train_hr_image = tf.placeholder('float32', [BATCH_SIZE, 384, 384, 3], name='train_hr_images')
hr_imgs_vgg_loss = tf.image.resize_images(train_hr_image, size=[224, 224]) 





train_hr_img_list = sorted(tl.files.load_file_list(path=train_hr_filepath, regx='.*.png', printable=False))
sample_imgs = load_images(train_hr_img_list[0: BATCH_SIZE], train_hr_filepath)
sample_imgs_hr = tl.prepro.threading_data(sample_imgs, fn=crop_scale_images, is_random=False)
print('sample HR sub-image:',sample_imgs_hr.shape, sample_imgs_hr.min(), sample_imgs_hr.max())


sess = tf.Session()
tl.layers.initialize_global_variables(sess)
resized_imgae = sess.run(hr_imgs_vgg_loss, {train_hr_image: sample_imgs_hr})
print(resized_imgae.min(), resized_imgae.max())