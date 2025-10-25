---
title: "Computer Vision Classification of Breast Cancer Tumors via Deep Learning"
excerpt: "Binary and multi-class tumor classification using transfer learning (ResNet152) with PyTorch — strong accuracy on both binary and 6-class tasks.<br><img src='/images/breast-cancer-loss-func.png'><br>" 
collection: portfolio
---

I applied transfer learning with ResNet152 (PyTorch) to classify breast cancer tumors. The workflow includes data pre-processing, augmentations, and fine-tuning a pre-trained ResNet152 for both binary and multi-class classification.

<br><img src="/images/breast-cancer-loss-func.png"><br>


Key results
- Binary classification (benign vs malignant) — Test accuracy: 99.3%, Test loss: 0.02 (ResNet152 transfer learning).
- Multi-class classification (6 tumor types) — Accuracy: 90.30% via transfer learning with ResNet152.

Artifacts
- [Notebook (Colab)](https://colab.research.google.com/github/Ianyliu/feitian-courses/blob/main/CIS335%20Machine%20Learning%20%26%20AI/CIS421_Final_Project2_Breast_Cancer_Classification_Ian_Liu.ipynb)

<br><img src="/images/breast-cancer-types.png"><br>