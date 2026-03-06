import math

n = 200
p = 1/37
p_12 = 12/37

print("--- Single Number ---")
print(f"Expected: {n*p:.2f}, SD: {math.sqrt(n*p*(1-p)):.2f}")
p_ge_13 = 1 - sum(math.comb(n, k) * (p**k) * ((1-p)**(n-k)) for k in range(13))
print(f"P(X >= 13) = {p_ge_13:.6f} (1 in {1/p_ge_13:.1f})")
p_le_1 = sum(math.comb(n, k) * (p**k) * ((1-p)**(n-k)) for k in range(2))
print(f"P(X <= 1) = {p_le_1:.4f} (1 in {1/p_le_1:.1f})")

# Let's check 28 which appeared 1 time
p_eq_1 = math.comb(n, 1) * (p**1) * ((1-p)**(n-1))
print(f"P(X = 1) = {p_eq_1:.4f}")
p_eq_0 = math.comb(n, 0) * (p**0) * ((1-p)**(n-0))
print(f"P(X = 0) = {p_eq_0:.4f}")

# Let's check 24 which appeared 13 times
p_eq_13 = math.comb(n, 13) * (p**13) * ((1-p)**(n-13))
print(f"P(X = 13) = {p_eq_13:.6f}")


print("--- Upper Third (3rd Dozen) ---")
print(f"Expected: {n*p_12:.2f}, SD: {math.sqrt(n*p_12*(1-p_12)):.2f}")
# Graph shows:
# 1st 12: ~74-75
# 2nd 12: ~73
# 3rd 12: ~52
p_le_52 = sum(math.comb(n, k) * (p_12**k) * ((1-p_12)**(n-k)) for k in range(53))
print(f"P(X <= 52) = {p_le_52:.4f} (1 in {1/p_le_52:.1f})")
