//DEPRACATED - This component is no longer used and will be removed in future versions. Please refer to the new user management interface for managing team members.

// import { useState, useEffect } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Plus, Search, Loader2, MapPin } from 'lucide-react';
// import { toast } from 'sonner';
// import { fetchData } from '@/lib/api/crud';
// import { USER_ROLES } from '@/lib/constants';
// import { TwoStepUserCreationDialog } from '@/components/users/TwoStepUserCreationDialog';
// import type { AdminProfile } from '@/types/admin';

// export default function TeamManagement() {
//   const [users, setUsers] = useState<AdminProfile[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       const data = await fetchData('USERS', 'GET');
//       // Handle both array and paginated response formats
//       const usersList = Array.isArray(data) ? data : (data?.items || []);
//       // Map backend snake_case to frontend camelCase
//       const mappedUsers = usersList.map((u: any) => ({
//         uid: u.id,
//         firstName: u.first_name,
//         lastName: u.last_name,
//         email: u.email,
//         role: u.role?.name || 'teacher',
//         isActive: u.is_active,
//         isVerified: u.is_verified,
//         assignedRegions: typeof u.assigned_regions === 'string' 
//           ? JSON.parse(u.assigned_regions) 
//           : Array.isArray(u.assigned_regions) 
//             ? u.assigned_regions 
//             : [],
//       }));
//       setUsers(mappedUsers);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       toast.error('Failed to load users');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const filteredUsers = users.filter(user => 
//     user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     user.email.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const getRoleBadgeColor = (role: string) => {
//     switch (role) {
//       case USER_ROLES.SUPER_ADMIN: return 'bg-red-100 text-red-800 border-red-200';
//       case USER_ROLES.RECORDS_AUTHORITY: return 'bg-purple-100 text-purple-800 border-purple-200';
//       case USER_ROLES.DEPT_HEAD: return 'bg-blue-100 text-blue-800 border-blue-200';
//       case USER_ROLES.STAFF_MEMBER: return 'bg-green-100 text-green-800 border-green-200';
//       case USER_ROLES.FINANCE_OFFICER: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case USER_ROLES.HR_OFFICER: return 'bg-pink-100 text-pink-800 border-pink-200';
//       case USER_ROLES.AUDITOR: return 'bg-gray-100 text-gray-800 border-gray-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   return (
//     <div className="w-full space-y-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
//             User Management
//           </h1>
//           <p className="text-gray-600 mt-1 font-medium">
//             Create and manage user accounts with assigned roles and permissions
//           </p>
//         </div>
//         <Button
//           onClick={() => setIsAddDialogOpen(true)}
//           className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
//         >
//           <Plus className="h-4 w-4 mr-2" />
//           Add User
//         </Button>
//       </div>

//       <TwoStepUserCreationDialog
//         isOpen={isAddDialogOpen}
//         onClose={() => setIsAddDialogOpen(false)}
//         onUserCreated={() => fetchUsers()}
//       />

//       <Card className="shadow-sm border-gray-150 rounded-xl">
//         <CardHeader className="pb-4 border-b border-gray-100">
//           <CardTitle className="flex items-center gap-3 text-lg">
//             <div className="p-2 bg-blue-50 rounded-lg">
//               <Search className="h-5 w-5 text-blue-600" />
//             </div>
//             Find Users
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="pt-4">
//           <div className="relative">
//             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <Input
//               placeholder="Search by name or email..."
//               className="pl-11 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-blue-50"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="shadow-sm border-gray-150 rounded-xl overflow-hidden">
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow className="border-gray-100 bg-gradient-to-r from-gray-50 to-gray-25 hover:bg-gray-50">
//                 <TableHead className="text-gray-700 font-semibold">Name</TableHead>
//                 <TableHead className="text-gray-700 font-semibold">Role</TableHead>
//                 <TableHead className="text-gray-700 font-semibold">Email</TableHead>
//                 <TableHead className="text-gray-700 font-semibold">Assigned Regions</TableHead>
//                 <TableHead className="text-gray-700 font-semibold">Status</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-12 border-gray-100">
//                     <div className="flex flex-col items-center justify-center space-y-3">
//                       <div className="relative w-10 h-10">
//                         <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-spin" style={{maskImage: 'conic-gradient(transparent 70%, black)'}} />
//                       </div>
//                       <p className="text-gray-600 font-medium">Loading users...</p>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ) : filteredUsers.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-12 border-gray-100 text-gray-500">
//                     No users found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredUsers.map((user) => (
//                   <TableRow key={user.uid} className="border-gray-100 hover:bg-blue-50/50 transition">
//                     <TableCell className="font-semibold text-gray-900">
//                       {user.firstName} {user.lastName}
//                     </TableCell>
//                     <TableCell>
//                       <Badge className={`${getRoleBadgeColor(user.role)} border rounded-full px-3 py-1 text-xs font-medium`}>
//                         {user.role.replace('_', ' ').toUpperCase()}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-gray-600">{user.email}</TableCell>
//                     <TableCell>
//                       {user.assignedRegions && user.assignedRegions.length > 0 ? (
//                         <div className="flex items-center gap-2 text-sm text-gray-700">
//                           <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           <span className="truncate">
//                             {user.assignedRegions.length > 2
//                               ? `${user.assignedRegions.slice(0, 2).join(', ')} +${user.assignedRegions.length - 2}`
//                               : user.assignedRegions.join(', ')}
//                           </span>
//                         </div>
//                       ) : (
//                         <span className="text-gray-400 text-sm">—</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={user.isActive ? 'default' : 'secondary'}
//                         className={`rounded-full px-3 py-1 text-xs font-medium ${
//                           user.isActive
//                             ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
//                             : 'bg-gray-100 text-gray-600 border-gray-200'
//                         }`}
//                       >
//                         {user.isActive ? 'Active' : 'Inactive'}
//                       </Badge>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

