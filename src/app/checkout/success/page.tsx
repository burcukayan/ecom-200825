export default async function CheckoutSuccessPage ({ searchParams }) {
  const { session_id } = await searchParams;

  console.log(session_id);

  return (
    <p>Checkout was successful!</p>
  )
}