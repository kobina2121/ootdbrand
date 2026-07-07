import Link from "next/link";
import { UserRound, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { listRegisteredUsersForAdmin } from "@/lib/services/user-service";

type AdminUsersPageProps = {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
 const params = await searchParams;
 const pageParam = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
 const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
 const pageSize = 20;
 const { users, pagination } = await listRegisteredUsersForAdmin({ page, pageSize });
 const customerCount = users.filter((user) => user.role === "customer").length;
 const adminCount = users.length - customerCount;
 const verifiedCount = users.filter((user) => user.emailVerified).length;
 const buildHref = (nextPage: number) => `/admin/users?page=${nextPage}`;

 return (
 <div className="space-y-5">
 <Card className="border-black/10 bg-white/85 shadow-sm ">
 <CardHeader className="space-y-4">
 <div>
 <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Accounts</p>
 <CardTitle className="font-sans text-2xl font-semibold">Users</CardTitle>
 </div>
 <div className="grid gap-3 sm:grid-cols-4">
 <div className="rounded-xl border border-black/10 bg-white px-3 py-2 ">
 <p className="text-xs uppercase tracking-wide text-muted-foreground">Total users</p>
 <p className="text-lg font-semibold">{pagination.totalCount}</p>
 </div>
 <div className="rounded-xl border border-black/10 bg-white px-3 py-2 ">
 <p className="text-xs uppercase tracking-wide text-muted-foreground">Customers (page)</p>
 <p className="text-lg font-semibold">{customerCount}</p>
 </div>
 <div className="rounded-xl border border-black/10 bg-white px-3 py-2 ">
 <p className="text-xs uppercase tracking-wide text-muted-foreground">Admins (page)</p>
 <p className="text-lg font-semibold">{adminCount}</p>
 </div>
 <div className="rounded-xl border border-black/10 bg-white px-3 py-2 ">
 <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified (page)</p>
 <p className="text-lg font-semibold">{verifiedCount}</p>
 </div>
 </div>
 </CardHeader>
 </Card>

 <Card className="border-black/10 bg-white/90 shadow-sm ">
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/50 hover:bg-muted/50 ">
 <TableHead>Name</TableHead>
 <TableHead>Email</TableHead>
 <TableHead>Role</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Joined</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {users.length === 0 ? (
 <TableRow>
 <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
 <div className="flex flex-col items-center gap-2">
 <UsersRound className="size-6 text-muted-foreground" />
 <p>No users found.</p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 users.map((user) => (
 <TableRow key={user.id}>
 <TableCell>
 <div className="flex items-center gap-3">
 <div className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.03]">
 <UserRound className="size-4 text-muted-foreground" />
 </div>
 <span className="font-medium">{user.name}</span>
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <p>{user.email}</p>
 {user.pendingEmail ? (
 <p className="text-xs text-muted-foreground">Pending: {user.pendingEmail}</p>
 ) : null}
 </div>
 </TableCell>
 <TableCell>
 <Badge variant={user.role === "admin" ? "default" : "outline"} className="rounded-full capitalize">
 {user.role}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge variant={user.emailVerified || user.role === "admin" ? "secondary" : "outline"} className="rounded-full">
 {user.emailVerified || user.role === "admin" ? "Verified" : "Unverified"}
 </Badge>
 </TableCell>
 <TableCell className="text-muted-foreground">
 {user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-2">
 <Link
 href={buildHref(Math.max(1, pagination.page - 1))}
 aria-disabled={pagination.page <= 1}
 className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
 >
 <Button variant="outline" size="sm" className="rounded-full">Prev</Button>
 </Link>
 <Badge variant="outline" className="rounded-full border-black/20 ">
 Page {pagination.page} of {pagination.totalPages}
 </Badge>
 <Link
 href={buildHref(Math.min(pagination.totalPages, pagination.page + 1))}
 aria-disabled={pagination.page >= pagination.totalPages}
 className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
 >
 <Button variant="outline" size="sm" className="rounded-full">Next</Button>
 </Link>
 </div>
 </div>
 );
}
