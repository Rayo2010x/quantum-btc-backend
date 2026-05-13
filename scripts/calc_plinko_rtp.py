import math

def check(rows, mults, name):
    if len(mults) != rows + 1:
        print(f"Error: {len(mults)} mults for {rows} rows")
        return 0
    
    rtp = 0
    for k in range(rows + 1):
        prob = math.comb(rows, k) * (0.5 ** rows)
        contrib = prob * mults[k]
        rtp += contrib
    print(f"{name:15} RTP: {rtp:.4f} ({rtp*100:.2f}%)   Mults: {mults}")
    return rtp

check(8, [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6], "low 8") # 98.98%
check(8, [5.6, 2.0, 1.1, 1.0, 0.5, 1.0, 1.1, 2.0, 5.6], "low 8 b") # 98.36% -> let's make edges 5.4 -> 98.36 - 2*(0.0039)*0.2 = 98.20%
check(8, [5.4, 2.0, 1.1, 1.0, 0.4, 1.0, 1.1, 2.0, 5.4], "low 8 c") # 95.31% 
check(8, [5.6, 2.0, 1.1, 1.0, 0.45, 1.0, 1.1, 2.0, 5.6], "low 8 d")

check(8, [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13], "medium 8") # 98.91%
check(8, [13, 3, 1.2, 0.7, 0.4, 0.7, 1.2, 3, 13], "medium 8 b") # 96.72%
check(8, [13, 3, 1.2, 0.7, 0.45, 0.7, 1.2, 3, 13], "medium 8 c")

check(8, [29, 5.8, 1.1, 0.2, 0.2, 0.2, 1.1, 5.8, 29], "high 8")
