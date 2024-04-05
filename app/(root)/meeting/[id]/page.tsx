export default function Meeting({ params }: { params: { id: string } }) {
  return <h1>Meeting Room: #{params.id}</h1>;
}
