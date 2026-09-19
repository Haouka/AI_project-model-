"""
Machine Learning Evaluation Suite for Document Screening Forensics.
Calculates Precision, Recall, F1, ROC-AUC, False Positive Rate (FPR),
and False Negative Rate (FNR) across authentic and tampered document datasets.
"""
from typing import List, Dict, Any
import numpy as np


class ScreeningModelEvaluator:
    def evaluate(self, y_true: List[int], y_pred: List[int], y_scores: List[float]) -> Dict[str, Any]:
        y_true_arr = np.array(y_true)
        y_pred_arr = np.array(y_pred)
        y_scores_arr = np.array(y_scores)

        tp = int(np.sum((y_true_arr == 1) & (y_pred_arr == 1)))
        fp = int(np.sum((y_true_arr == 0) & (y_pred_arr == 1)))
        tn = int(np.sum((y_true_arr == 0) & (y_pred_arr == 0)))
        fn = int(np.sum((y_true_arr == 1) & (y_pred_arr == 0)))

        precision = tp / max(tp + fp, 1)
        recall = tp / max(tp + fn, 1)
        f1 = 2 * (precision * recall) / max(precision + recall, 1e-6)
        fpr = fp / max(fp + tn, 1)
        fnr = fn / max(fn + tp, 1)
        accuracy = (tp + tn) / max(len(y_true), 1)

        # Approximate ROC-AUC via rank-order
        sorted_indices = np.argsort(y_scores_arr)[::-1]
        y_true_sorted = y_true_arr[sorted_indices]
        n_pos = np.sum(y_true_arr == 1)
        n_neg = np.sum(y_true_arr == 0)

        if n_pos > 0 and n_neg > 0:
            rank = np.arange(len(y_scores_arr), 0, -1)
            rank_sum_pos = np.sum(rank[y_true_sorted == 1])
            auc = (rank_sum_pos - (n_pos * (n_pos + 1)) / 2) / (n_pos * n_neg)
        else:
            auc = 1.0

        return {
            "total_samples": len(y_true),
            "confusion_matrix": {"TP": tp, "FP": fp, "TN": tn, "FN": fn},
            "metrics": {
                "accuracy": round(float(accuracy), 4),
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "f1_score": round(float(f1), 4),
                "false_positive_rate": round(float(fpr), 4),
                "false_negative_rate": round(float(fnr), 4),
                "roc_auc": round(float(auc), 4),
            },
        }


if __name__ == "__main__":
    evaluator = ScreeningModelEvaluator()
    # Benchmark synthetic validation set
    y_true = [1, 1, 1, 1, 0, 0, 0, 0, 0, 1]
    y_pred = [1, 1, 1, 0, 0, 0, 0, 1, 0, 1]
    y_scores = [0.95, 0.88, 0.91, 0.45, 0.12, 0.08, 0.22, 0.65, 0.05, 0.89]

    results = evaluator.evaluate(y_true, y_pred, y_scores)
    print("Forensics Benchmark Report:")
    for k, v in results["metrics"].items():
        print(f"  {k}: {v}")
