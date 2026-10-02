# Sliding Window Basics

A sliding window is an algorithmic technique used to perform operations on a specific window size of an array or sequence, such as finding the maximum sum of $k$ consecutive elements.

Instead of recalculating the entire window sum from scratch ($O(n \times k)$), the window slides by one element:
1. Add the incoming element entering the window.
2. Subtract the outgoing element leaving the window.

This reduces the overall time complexity to $O(n)$.
