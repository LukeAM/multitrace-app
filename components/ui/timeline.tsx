import { Badge } from "@/components/ui/badge";

<div className="flex items-center gap-2">
  <Badge variant="outline" className="bg-muted/50">
    {entry.badge}
  </Badge>
  {entry.slackChannel && (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted cursor-pointer">
      <span>{entry.slackChannel}</span>
      <span className="text-muted-foreground">&gt;</span>
    </div>
  )}
  {entry.notionDoc && (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted cursor-pointer">
      <span>{entry.notionDoc}</span>
      <span className="text-muted-foreground">&gt;</span>
    </div>
  )}
</div> 