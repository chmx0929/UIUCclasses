import metapy
import sys

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python {} config-file k_fold".format(sys.argv[0]))
        sys.exit(1)
    f_config = sys.argv[1]
    k = int(sys.argv[2])

    print("Loading dataset and indexing ...")
    fidx = metapy.index.make_forward_index(f_config)
    dset = metapy.classify.MulticlassDataset(fidx)
    print("#instances: {}".format(len(dset)))
    print("#labels: {}".format(fidx.num_labels()))
    print("labels: {}".format(set([dset.label(instance) for instance in dset])))

    print("\nOne-vs-All SVM with {}-fold cross-validation:".format(k))
    view = metapy.classify.MulticlassDatasetView(dset)
    mtrx = metapy.classify.cross_validate(lambda fold: metapy.classify.OneVsAll(fold,
                                                                                metapy.classify.SGD,
                                                                                loss_id='hinge'),
                                          view, k)

    print("confusion matrix:")
    print(mtrx)

    print("evaluation:")
    mtrx.print_stats()
