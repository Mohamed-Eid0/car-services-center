import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'
import { useData } from '../contexts/DataContext'

const UserManagement = ({ user, onLogout }) => {
  const { t :_t} = useTranslation()
  const { invalidateUsers } = useData()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'RECEPTIONIST'
  })

  const roles = [
    { value: 'SUPER_ADMIN', label: 'مشرف عام', color: 'bg-red-100 text-red-800' },
    { value: 'ADMIN', label: 'مشرف', color: 'bg-blue-100 text-blue-800' },
    { value: 'RECEPTIONIST', label: 'موظف استقبال', color: 'bg-green-100 text-green-800' },
    { value: 'TECHNICIAN', label: 'فني', color: 'bg-yellow-100 text-yellow-800' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('خطأ في جلب المستخدمين')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.username || formData.username.length < 3) {
      toast.error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      return
    }
    
    if (!formData.password || formData.password.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل')
      return
    }
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('الرجاء إدخال الاسم الأول والأخير')
      return
    }
    
    try {
      await api.createUser(formData)
      toast.success('تم إنشاء المستخدم بنجاح')
      invalidateUsers()
      setIsCreateDialogOpen(false)
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'RECEPTIONIST'
      })
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      const errorMsg = error.message || 'خطأ في إنشاء المستخدم'
      if (errorMsg.includes('already exists')) {
        toast.error('اسم المستخدم موجود بالفعل')
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.username || formData.username.length < 3) {
      toast.error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      return
    }
    
    if (formData.password && formData.password.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل')
      return
    }
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('الرجاء إدخال الاسم الأول والأخير')
      return
    }
    
    try {
      // Only include password if it was changed
      const updateData = { ...formData }
      if (!updateData.password || updateData.password === '') {
        delete updateData.password
      }
      
      await api.updateUser(selectedUser.id, updateData)
      toast.success('تم تحديث المستخدم بنجاح')
      invalidateUsers()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setFormData({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'RECEPTIONIST'
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      const errorMsg = error.message || 'خطأ في تحديث المستخدم'
      if (errorMsg.includes('not found')) {
        toast.error('المستخدم غير موجود')
      } else if (errorMsg.includes('already exists')) {
        toast.error('اسم المستخدم موجود بالفعل')
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    // Prevent deleting yourself
    if (userId === user.id) {
      toast.error('لا يمكنك حذف حسابك الخاص')
      return
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await api.deleteUser(userId)
        toast.success('تم حذف المستخدم بنجاح')
        invalidateUsers()
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        const errorMsg = error.message || 'خطأ في حذف المستخدم'
        if (errorMsg.includes('not found')) {
          toast.error('المستخدم غير موجود')
        } else {
          toast.error(errorMsg)
        }
      }
    }
  }

  const openEditDialog = (userToEdit) => {
    setSelectedUser(userToEdit)
    setFormData({
      username: userToEdit.username,
      password: '',
      first_name: userToEdit.first_name,
      last_name: userToEdit.last_name,
      role: userToEdit.role
    })
    setIsEditDialogOpen(true)
  }

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? roleObj.label : role
  }

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? roleObj.color : 'bg-gray-100 text-gray-800'
  }

  const canManageUser = (targetUser) => {
    if (user.role === 'SUPER_ADMIN') return true
    if (user.role === 'ADMIN' && targetUser.role !== 'SUPER_ADMIN' && targetUser.role !== 'ADMIN') return true
    return false
  }

  const canCreateRole = (role) => {
    if (user.role === 'SUPER_ADMIN') return true
    if (user.role === 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') return true
    return false
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="إدارة المستخدمين">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="إدارة المستخدمين">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span>مستخدمو النظام</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  إدارة حسابات المستخدمين والأدوار والصلاحيات
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-[200px]">
                  <Input
                    placeholder="بحث عن مستخدم..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مستخدم
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                      <DialogDescription>
                        املأ تفاصيل المستخدم الجديد
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="username" className="text-right">
                            اسم المستخدم
                          </Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="col-span-3"
                            placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                            minLength={3}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">
                            كلمة المرور
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="col-span-3"
                            placeholder="أدخل كلمة المرور (4 أحرف على الأقل)"
                            minLength={4}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="first_name" className="text-right">
                            الاسم الأول
                          </Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="col-span-3"
                            placeholder="أدخل الاسم الأول"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="last_name" className="text-right">
                            الاسم الأخير
                          </Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="col-span-3"
                            placeholder="أدخل الاسم الأخير"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">
                            الدور
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.filter(role => canCreateRole(role.value)).map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">إنشاء مستخدم</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>الدور</TableHead>
                  {user.role === 'SUPER_ADMIN' && <TableHead>كلمة المرور</TableHead>}
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'SUPER_ADMIN' ? 6 : 5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Users className="h-12 w-12 mb-3 text-gray-400" />
                        <p className="text-lg font-medium">لا يوجد مستخدمين</p>
                        <p className="text-sm mt-1">ابدأ بإضافة مستخدم جديد</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.filter(userItem => 
                  userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  `${userItem.first_name} ${userItem.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'SUPER_ADMIN' ? 6 : 5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Users className="h-12 w-12 mb-3 text-gray-400" />
                        <p className="text-lg font-medium">لا توجد نتائج</p>
                        <p className="text-sm mt-1">لم يتم العثور على مستخدمين بهذا الاسم</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.filter(userItem => 
                    userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    `${userItem.first_name} ${userItem.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">{userItem.username}</TableCell>
                    <TableCell>{`${userItem.first_name} ${userItem.last_name}`}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(userItem.role)}>
                        {getRoleLabel(userItem.role)}
                      </Badge>
                    </TableCell>
                    {user.role === 'SUPER_ADMIN' && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">
                            {showPasswords[userItem.id] ? '••••••••' : '••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(userItem.id)}
                          >
                            {showPasswords[userItem.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                        {userItem.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {canManageUser(userItem) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(userItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
              <DialogDescription>
                تحديث تفاصيل المستخدم
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_username" className="text-right">
                    اسم المستخدم
                  </Label>
                  <Input
                    id="edit_username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="col-span-3"
                    placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                    minLength={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_password" className="text-right">
                    كلمة المرور الجديدة
                  </Label>
                  <Input
                    id="edit_password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="col-span-3"
                    placeholder="اتركه فارغاً للاحتفاظ بالحالي (4 أحرف على الأقل)"
                    minLength={4}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_first_name" className="text-right">
                    الاسم الأول
                  </Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="col-span-3"
                    placeholder="أدخل الاسم الأول"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_last_name" className="text-right">
                    الاسم الأخير
                  </Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="col-span-3"
                    placeholder="أدخل الاسم الأخير"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_role" className="text-right">
                    الدور
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => canCreateRole(role.value)).map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تحديث المستخدم</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default UserManagement
