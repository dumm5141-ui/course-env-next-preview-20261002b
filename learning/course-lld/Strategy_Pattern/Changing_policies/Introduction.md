# Changing Policies

In real-world business domains, pricing, discounting, and promotional rules change frequently. Hardcoding these rules into core transactional workflows causes coupling and regression risks.

By applying the Strategy Pattern to policies:
- Each calculation rule is encapsulated behind a shared policy interface.
- New discounting mechanisms can be introduced without touching existing ordering or billing code.
- Different policies can be composed or selected dynamically based on user tier, seasonal campaigns, or cart attributes.
