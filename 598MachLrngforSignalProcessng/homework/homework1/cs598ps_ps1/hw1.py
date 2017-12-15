import matplotlib.pyplot as plt
import librosa
import numpy as np
import librosa.display
import numpy as np
import math
import matplotlib.pyplot as plt

#compute the dot product of fourier matrix and hanning matrix
def f_dot_h(N):
    f = np.exp(-2j * np.pi / N)
    col = np.vander([f], N, True)
    F = np.vander(col.flatten(), N, True) / np.sqrt(N)
    hann = np.hanning(N)
    H = np.diag(hann)
    FH = np.dot(F,H)
    return FH

#get matrix A, k is the number of Fourier and hanning matrix (rounded up)
def matrix_A(FH,num_sample):
    k = int(math.ceil((num_sample-1024+512.0)/512.0))
    W = np.zeros((1024*k, 512+512*k))
    idx = 0
    for i in range(k):
        for j in range(1024):
            W[i*1024+j, idx:idx+1024] = FH[j]
        idx += 512
    Z = np.ones(num_sample)
    Z = np.diag(Z)
    padding = np.zeros((512+512*k-num_sample,num_sample))
    Z = np.concatenate((Z, padding), axis=0)
    A = np.dot(W,Z)
    result = A.real 
    return result


def main():
    y, sr = librosa.load('myvoics.wav')
    y = y[:15000]
    plt.figure(figsize=(12, 8))
    num_sample = len(y)
    FH = f_dot_h(1024)
    A = matrix_A(FH,num_sample)
    D_vec = np.dot(A,y)

    #reshape the vector to matrix
    k = int(math.ceil((num_sample-1024+512.0)/512.0))
    D_short = D_vec.reshape(k, 1024)
    D_short = np.transpose(D_short)

    #use librosa library to convert the amplitude to DB
    D = librosa.amplitude_to_db(D_short, ref=np.max)

    #use the lower half of the matrix
    D = D[:512, :]

    f = plt.figure()
    #scale the x-axis from index to time   
    plt.subplot(2, 1, 1)
    librosa.display.specshow(D,  x_axis='time', y_axis='linear')
    plt.colorbar()
    plt.title('Linear-frequency power spectrogram')

    plt.subplot(2, 1, 2)
    librosa.display.specshow(D, x_axis='time',y_axis='log')
    plt.colorbar()
    plt.title('Log-frequency power spectrogram')

    plt.tight_layout()
    plt.show()
    f.savefig("plot1.pdf")

if __name__ == '__main__':
    main()