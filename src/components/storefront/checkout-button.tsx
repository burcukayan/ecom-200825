import { Button } from "../ui/button";

export function CheckoutButton() {
  return (
    <form action="/api/stripe/checkout" method="POST">
      <input type="hidden" name="price_id" value="price_1U4yBJRV3u6h8nYqFRPxlisd" /> 
      <input type="hidden" name="quantity" value="2" /> 
      <Button type="submit" role="link">
        Checkout
      </Button>
    </form>
  );
}
