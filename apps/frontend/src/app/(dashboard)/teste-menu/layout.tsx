// Este layout é propositalmente simples para não adicionar outros componentes.
export default function TesteMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
