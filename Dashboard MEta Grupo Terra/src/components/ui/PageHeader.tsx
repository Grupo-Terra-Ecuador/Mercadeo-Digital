export default function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-lg font-bold text-text">{title}</h1>
      {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}
    </div>
  );
}
