import numpy as np
from scipy import spatial
from scipy import stats

#question 1
data_midterm=np.loadtxt("data.online.scores",usecols=(1,))
#a
print np.amax(data_midterm)
print np.amin(data_midterm)
#b
print np.percentile(data_midterm, 25)
print np.median(data_midterm)
print np.percentile(data_midterm, 75)
#c
print np.mean(data_midterm)
#d
print stats.mode(data_midterm)
#e
print np.var(data_midterm,ddof=1)

#question 2
data_final=np.loadtxt("data.online.scores",usecols=(2,))
#a
print np.var(data_final,ddof=1)
print np.var(stats.zscore(data_final),ddof=1)
#b
print (90-np.mean(data_final))/np.std(data_final)

#question 3
#a
print np.corrcoef(data_midterm,data_final)
#b
print np.cov(data_midterm,data_final)

#question 4
#a
print 107.0/(19.0+31.0+107.0)
#b
data_JSainsbury=np.genfromtxt("data.supermarkets.inventories",skip_header=1,skip_footer=1,usecols=range(2,102))
data_KingKullen=np.genfromtxt("data.supermarkets.inventories",skip_header=2,usecols=range(2,102))
print spatial.distance.minkowski(data_JSainsbury,data_KingKullen,1)
print spatial.distance.minkowski(data_JSainsbury,data_KingKullen,2)
print spatial.distance.minkowski(data_JSainsbury,data_KingKullen,float("inf"))
print 1 - spatial.distance.cosine(data_JSainsbury, data_KingKullen)
arr_sum_data_JSainsbury=[np.sum(data_JSainsbury)]*100
arr_sum_data_KingKullen=[np.sum(data_KingKullen)]*100
print stats.entropy(data_JSainsbury/arr_sum_data_JSainsbury,qk=(data_KingKullen/arr_sum_data_KingKullen))

#question 5
print stats.chisquare(f_obs=[1346.0,133.0,430.0,32974.0],f_exp=[1776.0*(1479.0/34883.0),33107.0*(1479.0/34883.0),1776.0*(33404.0/34883.0),33107.0*(33404.0/34883.0)])

























