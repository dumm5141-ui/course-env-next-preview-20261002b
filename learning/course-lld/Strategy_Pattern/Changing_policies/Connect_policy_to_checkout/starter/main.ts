import { CheckoutWorkflow } from "./src/checkout.ts";

const workflow = new CheckoutWorkflow({ applyDiscount: (n) => n * 0.9 });
console.log("Total:", workflow.calculateTotal([{ price: 100, quantity: 1 }]));
