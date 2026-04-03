"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  CircleCheckIcon, 
  EllipsisVerticalIcon, 
  Columns3Icon, 
  ChevronDownIcon, 
  PlusIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CircleDotIcon,
  XCircleIcon,
  AlertCircleIcon,
  CircleDashedIcon,
  SignalHighIcon,
  SignalMediumIcon,
  SignalLowIcon,
  MinusIcon 
} from "lucide-react"
import { NewIssueDialog, type Issue } from "./new-issue-dialog"
import { useProjects } from "./projects-context"
import { type Todo } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

type TableViewMode = "default" | "assignments"
type AssignmentView = "tasks-from-others" | "assigned-by-me"

// Convert Todo to table row format
function todoToRow(todo: Todo, index: number, counterpartyEmail?: string) {
  return {
    id: index + 1,
    header: todo.title,
    type: "Todo",
    status: mapStatus(todo.status),
    priority: mapPriority(todo.priority),
    target: "0",
    limit: "0",
    reviewer: "Assign",
    description: todo.description || "",
    projectId: todo.projectId,
    from: counterpartyEmail || "Self",
    todoId: todo.id,
  }
}

function mapStatus(status: string) {
  const map: Record<string, string> = {
    "in-progress": "In Progress",
    "done": "Done",
    "cancelled": "Canceled",
    "delayed": "Backlog",
  }
  return map[status] || "In Progress"
}

function reverseMapStatus(displayStatus: string): "in-progress" | "done" | "cancelled" | "delayed" {
  const map: Record<string, "in-progress" | "done" | "cancelled" | "delayed"> = {
    "In Progress": "in-progress",
    "Done": "done",
    "Canceled": "cancelled",
    "Backlog": "delayed",
  }
  return map[displayStatus] || "in-progress"
}

function mapPriority(priority: string) {
  const map: Record<string, string> = {
    "no-priority": "No priority",
    "urgent": "Urgent",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
  }
  return map[priority] || "Medium"
}

function reverseMapPriority(displayPriority: string): "no-priority" | "urgent" | "high" | "medium" | "low" {
  const map: Record<string, "no-priority" | "urgent" | "high" | "medium" | "low"> = {
    "No priority": "no-priority",
    "Urgent": "urgent",
    "High": "high",
    "Medium": "medium",
    "Low": "low",
  }
  return map[displayPriority] || "medium"
}

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.enum(["Backlog", "Todo", "In Progress", "Done", "Canceled", "Duplicate"]),
  priority: z.enum(["No priority", "Urgent", "High", "Medium", "Low"]),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  todoId: z.string(),
})

// Status options for dropdown with Linear-style icons (muted colors)
const statusOptions = [
  { value: "In Progress", label: "In Progress", icon: CircleDotIcon, color: "#F0B000" },
  { value: "Done", label: "Done", icon: CircleCheckIcon, color: "#5E6AD2" },
  { value: "Canceled", label: "Canceled", icon: XCircleIcon, color: "#FFFFFF" },
  { value: "Backlog", label: "Backlog", icon: CircleDashedIcon, color: "#6B7280" },
] as const

// Priority options for dropdown with Linear-style icons
const priorityOptions = [
  { value: "No priority", label: "No priority", icon: MinusIcon, color: "#FFFFFF", number: 0 },
  { value: "Urgent", label: "Urgent", icon: AlertCircleIcon, color: "#FFFFFF", number: 1 },
  { value: "High", label: "High", icon: SignalHighIcon, color: "#FFFFFF", number: 2 },
  { value: "Medium", label: "Medium", icon: SignalMediumIcon, color: "#FFFFFF", number: 3 },
  { value: "Low", label: "Low", icon: SignalLowIcon, color: "#FFFFFF", number: 4 },
] as const

// Type badge colors
const typeColors: Record<string, string> = {
  "Documentation": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Bug": "bg-red-500/20 text-red-400 border-red-500/30",
  "Feature": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Todo": "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

interface DataTableProps {
  todos: Todo[]
  selectedProjectId?: string | null
  mode?: TableViewMode
}

export function DataTable({
  todos,
  selectedProjectId,
  mode = "default",
}: DataTableProps) {
  const { user } = useAuth()
  const { addTodo, deleteTodo, updateTodo } = useProjects()
  const [assigneeOptions, setAssigneeOptions] = React.useState<string[]>([])
  const [assignmentView, setAssignmentView] =
    React.useState<AssignmentView>("tasks-from-others")
  const [assignedByMeTodos, setAssignedByMeTodos] = React.useState<Todo[]>([])
  const [isLoadingAssignedByMe, setIsLoadingAssignedByMe] = React.useState(false)
  const currentUserEmail = user?.email?.toLowerCase() || ""
  
  const incomingTodos = React.useMemo(
    () =>
      todos.filter((todo) => {
        const assignedByEmail = todo.assignedByEmail?.toLowerCase() || ""
        return Boolean(assignedByEmail) && assignedByEmail !== currentUserEmail
      }),
    [currentUserEmail, todos]
  )

  const outgoingTodos = React.useMemo(() => {
    const localAssignedByMe = todos.filter((todo) => {
      const assignedByEmail = todo.assignedByEmail?.toLowerCase() || ""
      const assignedToEmail = todo.assignedToEmail?.toLowerCase() || ""

      return (
        assignedByEmail === currentUserEmail &&
        Boolean(assignedToEmail) &&
        assignedToEmail !== currentUserEmail
      )
    })

    const mergedTodos = [...localAssignedByMe]

    assignedByMeTodos.forEach((todo) => {
      if (!mergedTodos.some((currentTodo) => currentTodo.id === todo.id)) {
        mergedTodos.push(todo)
      }
    })

    return mergedTodos
  }, [assignedByMeTodos, currentUserEmail, todos])

  const visibleTodos = React.useMemo(() => {
    if (mode !== "assignments") {
      return todos
    }

    return assignmentView === "assigned-by-me" ? outgoingTodos : incomingTodos
  }, [assignmentView, incomingTodos, mode, outgoingTodos, todos])

  const counterpartyLabel =
    mode === "assignments" && assignmentView === "assigned-by-me" ? "To" : "From"

  const emptyMessage =
    mode === "assignments"
      ? assignmentView === "assigned-by-me"
        ? isLoadingAssignedByMe
          ? "Loading assigned tasks..."
          : "No tasks assigned by you yet."
        : "No tasks from others yet."
      : "No todos yet. Click \"Add Todo\" to create one."

  const data = React.useMemo(() => {
    return visibleTodos.map((todo, index) =>
      todoToRow(
        todo,
        index,
        mode === "assignments" && assignmentView === "assigned-by-me"
          ? todo.assignedToEmail || "Self"
          : todo.assignedByEmail || "Self"
      )
    )
  }, [assignmentView, mode, visibleTodos])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  React.useEffect(() => {
    if (selectedProjectId) return

    const loadAssigneeOptions = async () => {
      const res = await api.users.getOptions()
      if (!res.success || !Array.isArray(res.data)) return

      setAssigneeOptions(
        res.data
          .map((item) => String((item as { email?: string }).email || ""))
          .filter((email) => email && email !== user?.email)
      )
    }

    void loadAssigneeOptions()
  }, [selectedProjectId, user?.email])

  React.useEffect(() => {
    if (mode !== "assignments") return

    const loadAssignedByMeTodos = async () => {
      setIsLoadingAssignedByMe(true)
      const res = await api.todos.getAssignedByMe()

      if (res.success && Array.isArray(res.data)) {
        setAssignedByMeTodos(res.data)
      }

      setIsLoadingAssignedByMe(false)
    }

    void loadAssignedByMeTodos()
  }, [mode])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setRowSelection({})
  }, [assignmentView, mode])

  const syncAssignedByMeTodo = React.useCallback(
    (todoId: string, updates: Partial<Todo>) => {
      setAssignedByMeTodos((prev) =>
        prev.map((todo) => (todo.id === todoId ? { ...todo, ...updates } : todo))
      )
    },
    []
  )

  const removeAssignedByMeTodo = React.useCallback((todoId: string) => {
    setAssignedByMeTodos((prev) => prev.filter((todo) => todo.id !== todoId))
  }, [])

  const columns = React.useMemo<ColumnDef<typeof data[0]>[]>(() => [
    {
      accessorKey: "header",
      header: () => <div className="pl-4">Title</div>,
      size: 0,
      minSize: 150,
      cell: ({ row }) => {
        const typeClass = typeColors[row.original.type] || typeColors["Todo"];
        return (
          <div className="flex items-center gap-2 pl-4">
            <Badge variant="outline" className={`text-xs ${typeClass}`}>
              {row.original.type}
            </Badge>
            <TableCellViewer item={row.original} />
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "from",
      header: () => <div className="text-right pr-4">{counterpartyLabel}</div>,
      size: 220,
      minSize: 180,
      cell: ({ row }) => (
        <div className="flex justify-end text-sm text-muted-foreground pr-4">
          {row.original.from}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-right pr-6">Status</div>,
      size: 100,
      minSize: 100,
      cell: ({ row }) => {
        const status = statusOptions.find(s => s.value === row.original.status) || statusOptions[2]
        const StatusIcon = status.icon
        
        return (
          <div className="flex justify-end pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="h-7 gap-2 px-2 text-sm" />
                }
              >
                <StatusIcon className="size-4" style={{ color: status.color }} />
                <span>{status.label}</span>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {statusOptions.map((option) => {
                const Icon = option.icon
                const isSelected = row.original.status === option.value
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      if (row.original.todoId) {
                        updateTodo(
                          row.original.projectId ?? null,
                          row.original.todoId,
                          { status: reverseMapStatus(option.value) }
                        )
                        if (mode === "assignments" && assignmentView === "assigned-by-me") {
                          syncAssignedByMeTodo(row.original.todoId, {
                            status: reverseMapStatus(option.value),
                          })
                        }
                        toast.success(`Status updated to ${option.label}`)
                      }
                    }}
                    className="gap-2"
                  >
                    <Icon className="size-4" style={{ color: option.color }} />
                    <span className="flex-1">{option.label}</span>
                    {isSelected && <CircleCheckIcon className="size-4 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )
      },
    },
    {
      accessorKey: "priority",
      header: () => <div className="text-right pr-4">Priority</div>,
      size: 60,
      minSize: 60,
      cell: ({ row }) => {
        const priority = priorityOptions.find(p => p.value === row.original.priority) || priorityOptions[3]
        const PriorityIcon = priority.icon
        
        return (
          <div className="flex justify-end pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="h-7 gap-2 px-2 text-sm" />
                }
              >
                <PriorityIcon className="size-4 font-bold" style={{ color: priority.color }} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {priorityOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = row.original.priority === option.value
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        if (row.original.todoId) {
                          updateTodo(
                            row.original.projectId ?? null,
                            row.original.todoId,
                            { priority: reverseMapPriority(option.value) }
                          )
                          if (mode === "assignments" && assignmentView === "assigned-by-me") {
                            syncAssignedByMeTodo(row.original.todoId, {
                              priority: reverseMapPriority(option.value),
                            })
                          }
                          toast.success(`Priority updated to ${option.label}`)
                        }
                      }}
                      className="gap-2"
                    >
                      <Icon className="size-4" style={{ color: option.color }} />
                      <span className="flex-1">{option.label}</span>
                      {isSelected && <CircleCheckIcon className="size-4 text-primary" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-2"></div>,
      size: 40,
      minSize: 40,
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="flex size-8 text-muted-foreground" size="icon" />
              }
            >
              <EllipsisVerticalIcon />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => {
              const openDrawer = (window as unknown as Record<string, () => void>)[`open-drawer-${row.original.id}`]
              if (openDrawer) openDrawer()
            }}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Duplicated")}>Make a copy</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive" 
              onClick={() => {
                deleteTodo(row.original.projectId ?? null, row.original.todoId)
                if (mode === "assignments" && assignmentView === "assigned-by-me") {
                  removeAssignedByMeTodo(row.original.todoId)
                }
                toast.success("Deleted")
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ].filter((column) => {
    if ("accessorKey" in column && column.accessorKey === "from") {
      return !selectedProjectId
    }
    return true
  }), [
    assignmentView,
    counterpartyLabel,
    deleteTodo,
    mode,
    removeAssignedByMeTodo,
    selectedProjectId,
    syncAssignedByMeTodo,
    updateTodo,
  ])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    defaultColumn: {
      size: 100,
      minSize: 50,
    },
  })

  const tabsValue = mode === "assignments" ? assignmentView : "table"

  return (
    <Tabs
      value={tabsValue}
      onValueChange={(value) => {
        if (mode === "assignments" && (value === "tasks-from-others" || value === "assigned-by-me")) {
          setAssignmentView(value)
        }
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between  ">
        <Label htmlFor="view-selector" className="sr-only">View</Label>
        <div className="flex items-center gap-2 w-full">
          {mode === "assignments" && (
            <TabsList variant="line" className="h-10">
              <TabsTrigger value="tasks-from-others">Tasks from others</TabsTrigger>
              <TabsTrigger value="assigned-by-me">Assigned by me</TabsTrigger>
            </TabsList>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon />Columns<ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1"></div>
          <NewIssueDialog 
            onIssueCreated={(issue: Issue) => {
              const targetProjectId = selectedProjectId || null
              void addTodo(targetProjectId, {
                title: issue.title,
                description: issue.description,
                status: "in-progress",
                priority: issue.priority,
                assignedToEmail: issue.assignedToEmail,
                assignedByEmail: user?.email,
              })
            }}
            showAssigneeField={!selectedProjectId}
            assigneeOptions={assigneeOptions}
          >
            <Button variant="outline" size="sm">
              <PlusIcon />
              <span className="hidden lg:inline">Add Todo</span>
            </Button>
          </NewIssueDialog>
        </div>
      </div>
      <TabsContent value={tabsValue} className="relative flex flex-col gap-4 overflow-auto ">
        <div className="overflow-hidden rounded-lg border">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className={header.column.id === "header" ? "w-full" : "w-auto whitespace-nowrap"}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: -4, filter: "blur(2px)" }}
                      whileTap={{ scale: 0.998, backgroundColor: "var(--muted)" }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                        delay: Math.min(index * 0.015, 0.15)
                      }}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted relative cursor-default"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className={cell.column.id === "header" ? "w-full" : "w-auto whitespace-nowrap"}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

interface TableRowItem {
  id: number
  header: string
  type: string
  status: string
  priority: string
  from?: string
  description: string
  projectId?: string | null
  todoId: string
}

function TodoViewDrawer({ item, open, onOpenChange }: { item: TableRowItem, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const isMobile = useIsMobile()
  const [desc, setDesc] = React.useState(item.description || "")
  const { updateTodo } = useProjects()

  const handleSave = () => {
    if (item.todoId) {
      updateTodo(item.projectId ?? null, item.todoId, { description: desc })
      toast.success("Todo updated")
    }
    onOpenChange?.(false)
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">{item.header}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="text-2xl font-bold p-5">{item.header}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full p-4">
          <textarea
            className="text-sm w-full p-3 rounded min-h-[600px] bg-transparent border-0 outline-none focus:ring-0 focus:outline-none resize-none placeholder:text-muted-foreground/50"
            placeholder="Add description..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="flex gap-2 pt-4 mt-auto">
            <Button variant="default" onClick={handleSave}>Save</Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function TableCellViewer({ item }: { item: TableRowItem }) {
  const [open, setOpen] = React.useState(false)
  
  // Expose the open function globally for the edit menu
  React.useEffect(() => {
    const key = `open-drawer-${item.id}`
    ;(window as unknown as Record<string, () => void>)[key] = () => setOpen(true)
    return () => {
      delete (window as unknown as Record<string, unknown>)[key]
    }
  }, [item.id])
  
  return <TodoViewDrawer item={item} open={open} onOpenChange={setOpen} />
}
