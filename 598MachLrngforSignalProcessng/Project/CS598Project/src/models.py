
# coding: utf-8

import tensorflow as tf
import tensorlayer as tl
from tensorlayer.layers import *


# ### define generative network

def generator(images, is_train, reuse):
    w_init = tf.random_normal_initializer(stddev=0.02)
    b_init = None 
    
    # for batch normolization
    gamma_init = tf.random_normal_initializer(1., 0.02)
    beta_init = tf.random_normal_initializer(0.05)
    
    
    with tf.variable_scope("generator", reuse=reuse) as scope:
        # reuse the variables
        tl.layers.set_name_reuse(reuse)
        
        
        network = InputLayer(images, name='images_in_g')
        network = Conv2d(network, 64, (3, 3), (1, 1), act=tf.nn.relu, padding='SAME', W_init=w_init, name='k9n64s1_c_0')
        skip_hold_network = network

        # B residual blocks
        for i in range(16):
            skip_hold_block_network = network
            network = Conv2d(network, 64, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='k3n64s1_block_c1_%s' % (i+1))
            network = BatchNormLayer(network, act=tf.nn.relu, is_train=is_train, gamma_init=gamma_init, name='k3n64s1_block_b1_%s' % (i+1))
            network = Conv2d(network, 64, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='k3n64s1_block_c2_%s' % (i+1))
            network = BatchNormLayer(network, is_train=is_train, gamma_init=gamma_init, beta_init=beta_init, name='k3n64s1_block_b2_%s' % (i+1))
            network = ElementwiseLayer([network, skip_hold_block_network], tf.add, name='b_residual_block_%s' % (i+1))
    
        # skip connection
        network = Conv2d(network, 64, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='k3n64s1_after_c')
        network = BatchNormLayer(network, is_train=is_train, gamma_init=gamma_init, beta_init=beta_init, name='k3n64s1_after_b')
        network= ElementwiseLayer([network, skip_hold_network], tf.add, name='add_skip')
        
        # 2 sub-pixel layers
        network = Conv2d(network, 256, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='k3n256s1_1')
        network= SubpixelConv2d(network, scale=2, n_out_channel=None, act=tf.nn.relu, name='subpixels_1')

        network = Conv2d(network, 256, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='k3n256s1_2')
        network = SubpixelConv2d(network, scale=2, n_out_channel=None, act=tf.nn.relu, name='subpixels_2')

        network = Conv2d(network, 3, (1, 1), (1, 1), act=tf.nn.tanh, padding='SAME', W_init=w_init, b_init=b_init, use_cudnn_on_gpu=True, name='out')
        return network
    
    


# ### define discriminator network

def discriminator(images, is_train, reuse):
    w_init = tf.random_normal_initializer(stddev=0.02)
    b_init = None 
    
    # for batch normolization
    gamma_init = tf.random_normal_initializer(1., 0.02)
    beta_init = tf.random_normal_initializer(0.05)
    with tf.variable_scope("discriminator", reuse=reuse):
        # reuse the variables
        tl.layers.set_name_reuse(reuse)

        network = InputLayer(images, name='images_in_d')
        network = Conv2d(network, 64, (3, 3), (1, 1), act=tf.nn.leaky_relu, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_0')
        
        network = Conv2d(network, 64, (3, 3), (2, 2), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_1')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b1')
        
        # start 6 blocks
        network = Conv2d(network, 128, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_2')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b2')
        
        network = Conv2d(network, 128, (3, 3), (2, 2), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_3')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b3')
        
        network = Conv2d(network, 256, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_4')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b4')
        
        network = Conv2d(network, 256, (3, 3), (2, 2), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_5')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b5')
        
        network = Conv2d(network, 512, (3, 3), (1, 1), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_6')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b6')
        
        network = Conv2d(network, 512, (3, 3), (2, 2), act=None, padding='SAME', W_init=w_init, use_cudnn_on_gpu=True, name='c_7')
        network = BatchNormLayer(network, act=tf.nn.leaky_relu, is_train=is_train, gamma_init=gamma_init, name='b7')
        #end 6 blocks
        
        network = FlattenLayer(network, name='flatten')
        network = DenseLayer(network, n_units=1024, act=tf.nn.leaky_relu, name='fc2014')
        network = DenseLayer(network, n_units=1, name='out')
        
        
        logits = network.outputs
        network.outputs = tf.nn.sigmoid(network.outputs)
        
        return logits, network


# cite this
def Vgg19_model(rgb, reuse):
    """
    Build the VGG 19 Model

    Parameters
    -----------
    rgb : rgb image placeholder [batch, height, width, 3] values scaled [0, 1]
    """
    VGG_MEAN = [103.939, 116.779, 123.68]
    with tf.variable_scope("VGG19", reuse=reuse) as vs:
        start_time = time.time()
        print("build model started")
        rgb_scaled = rgb * 255.0
        # Convert RGB to BGR
        if tf.__version__ <= '0.11':
            red, green, blue = tf.split(3, 3, rgb_scaled)
        else: # TF 1.0
            # print(rgb_scaled)
            red, green, blue = tf.split(rgb_scaled, 3, 3)
        assert red.get_shape().as_list()[1:] == [224, 224, 1]
        assert green.get_shape().as_list()[1:] == [224, 224, 1]
        assert blue.get_shape().as_list()[1:] == [224, 224, 1]
        if tf.__version__ <= '0.11':
            bgr = tf.concat(3, [
                blue - VGG_MEAN[0],
                green - VGG_MEAN[1],
                red - VGG_MEAN[2],
            ])
        else:
            bgr = tf.concat([
                blue - VGG_MEAN[0],
                green - VGG_MEAN[1],
                red - VGG_MEAN[2],
            ], axis=3)
        assert bgr.get_shape().as_list()[1:] == [224, 224, 3]

        """ input layer """
        net_in = InputLayer(bgr, name='input')
        """ conv1 """
        network = Conv2d(net_in, n_filter=64, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv1_1')
        network = Conv2d(network, n_filter=64, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv1_2')
        network = MaxPool2d(network, filter_size=(2, 2), strides=(2, 2),
                    padding='SAME', name='pool1')
        """ conv2 """
        network = Conv2d(network, n_filter=128, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv2_1')
        network = Conv2d(network, n_filter=128, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv2_2')
        network = MaxPool2d(network, filter_size=(2, 2), strides=(2, 2),
                    padding='SAME', name='pool2')
        """ conv3 """
        network = Conv2d(network, n_filter=256, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv3_1')
        network = Conv2d(network, n_filter=256, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv3_2')
        network = Conv2d(network, n_filter=256, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv3_3')
        network = Conv2d(network, n_filter=256, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv3_4')
        network = MaxPool2d(network, filter_size=(2, 2), strides=(2, 2),
                    padding='SAME', name='pool3')
        """ conv4 """
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv4_1')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv4_2')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv4_3')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv4_4')
        network = MaxPool2d(network, filter_size=(2, 2), strides=(2, 2),
                    padding='SAME', name='pool4')                               # (batch_size, 14, 14, 512)
        conv = network
        """ conv5 """
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv5_1')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv5_2')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv5_3')
        network = Conv2d(network, n_filter=512, filter_size=(3, 3),
                    strides=(1, 1), act=tf.nn.relu,padding='SAME', name='conv5_4')
        network = MaxPool2d(network, filter_size=(2, 2), strides=(2, 2),
                    padding='SAME', name='pool5')                               # (batch_size, 7, 7, 512)
        """ fc 6~8 """
        network = FlattenLayer(network, name='flatten')
        network = DenseLayer(network, n_units=4096, act=tf.nn.relu, name='fc6')
        network = DenseLayer(network, n_units=4096, act=tf.nn.relu, name='fc7')
        network = DenseLayer(network, n_units=1000, act=tf.identity, name='fc8')
        print("build model finished: %fs" % (time.time() - start_time))
        return network, conv
        

