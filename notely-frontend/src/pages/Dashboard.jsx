import { FileText } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Welcome to Notely</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Select a note from the sidebar or create a new one to get started.
        </p>
      </div>
    </div>
  );
}
