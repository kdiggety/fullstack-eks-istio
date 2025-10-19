class ZScoreModel:
    def __init__(self, threshold: float = 3.0): self.threshold = threshold
    def score(self, zscores): return [1.0 if abs(z) >= self.threshold else 0.0 for z in zscores]
