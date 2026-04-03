"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  CheckCircle2Icon,
  XIcon,
} from "lucide-react";

const priorityOptions = [
  { value: "no-priority", label: "No priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export const issueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.literal("in-progress"), // Always In Progress
  priority: z.enum(["no-priority", "urgent", "high", "medium", "low"]),
  assignedToEmail: z.string().email().optional(),
});

export type Issue = z.infer<typeof issueSchema>;

interface NewIssueDialogProps {
  children?: React.ReactNode;
  onIssueCreated?: (issue: Issue) => void;
  showAssigneeField?: boolean;
  assigneeOptions?: string[];
}

export function NewIssueDialog({
  children,
  onIssueCreated,
  showAssigneeField = false,
  assigneeOptions = [],
}: NewIssueDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<
    (typeof priorityOptions)[number] | null
  >(null);
  const [assignedToEmail, setAssignedToEmail] = React.useState<string | null>(null);
  const [createMore, setCreateMore] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an issue title");
      return;
    }
    setIsSubmitting(true);
    const issue: Issue = {
      title: title.trim(),
      description: description.trim(),
      status: "in-progress",
      priority: priority?.value ?? "medium",
      assignedToEmail: assignedToEmail ?? undefined,
    };
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Issue created successfully");
    onIssueCreated?.(issue);
    if (createMore) {
      setTitle("");
      setDescription("");
      setPriority(null);
      setAssignedToEmail(null);
    } else {
      setOpen(false);
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setPriority(null);
        setAssignedToEmail(null);
      }, 200);
    }
    setIsSubmitting(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>
        {children || <Button>Add Todo</Button>}
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-xl">
        <DrawerDescription className="sr-only">New issue details</DrawerDescription>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerHeader className="border-b px-4 py-3 flex flex-row items-center justify-between gap-4">
            <DrawerTitle className="text-lg font-medium flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-normal">
                JOT
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                /
              </span>
              <span>New issue</span>
            </DrawerTitle>
            <div className="flex items-center gap-1">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                >
                  <XIcon className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-0 px-3 bg-transparent text-lg font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <textarea
                placeholder="Add description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px] resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none px-3"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-xs hover:bg-muted text-foreground h-7 px-2 text-xs font-medium outline-none transition-all"
                >
                  {priority ? priority.label : "Priority"}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-40 z-[100] bg-popover border rounded-md shadow-md p-1 pointer-events-auto"
                >
                  {priorityOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onPointerDown={() => setPriority(option)}
                      onClick={() => setPriority(option)}
                      className="gap-2 cursor-pointer"
                    >
                      <span className="flex-1 text-sm">{option.label}</span>
                      {priority?.value === option.value && (
                        <CheckCircle2Icon className="size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {showAssigneeField && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    type="button"
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-xs hover:bg-muted text-foreground h-7 px-2 text-xs font-medium outline-none transition-all"
                  >
                    {assignedToEmail ? `Assign: ${assignedToEmail}` : "Assign"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56 z-[100] bg-popover border rounded-md shadow-md p-1 pointer-events-auto"
                  >
                    <DropdownMenuItem
                      onPointerDown={() => setAssignedToEmail(null)}
                      onClick={() => setAssignedToEmail(null)}
                      className="gap-2 cursor-pointer"
                    >
                      <span className="flex-1 text-sm">Myself</span>
                      {!assignedToEmail && (
                        <CheckCircle2Icon className="size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                    {assigneeOptions.map((email) => (
                      <DropdownMenuItem
                        key={email}
                        onPointerDown={() => setAssignedToEmail(email)}
                        onClick={() => setAssignedToEmail(email)}
                        className="gap-2 cursor-pointer"
                      >
                        <span className="flex-1 text-sm truncate">{email}</span>
                        {assignedToEmail === email && (
                          <CheckCircle2Icon className="size-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t px-4 py-3 flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateMore(!createMore)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div
                  className={`size-4 rounded border flex items-center justify-center transition-colors ${createMore ? "bg-primary border-primary" : "border-muted-foreground/30"}`}
                >
                  {createMore && (
                    <CheckCircle2Icon className="size-3 text-primary-foreground" />
                  )}
                </div>
                Create more
              </button>
            </div>
            <div className="flex items-center gap-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !title.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Creating..." : "Create issue"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
