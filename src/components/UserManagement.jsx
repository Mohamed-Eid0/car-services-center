import { useState, useEffect } from 'react'
import Layout from './Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Table components not needed - using native HTML table
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'
import { useData } from '../contexts/DataContext'

const UserManagement = ({ user, onLogout }) => {
  const { invalidateUsers } = useData()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'TECHNICIAN'
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
        {/* Header with Add Button */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4" dir="rtl">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>مستخدمو النظام</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">إدارة حسابات المستخدمين والأدوار والصلاحيات</p>
          </div>
          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    املأ تفاصيل المستخدم الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                        minLength={3}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="أدخل كلمة المرور (4 أحرف على الأقل)"
                        minLength={4}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="first_name">الاسم الأول</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="أدخل الاسم الأول"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last_name">الاسم الأخير</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="أدخل الاسم الأخير"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">الدور</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
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
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">إنشاء مستخدم</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search Box */}
        <Card dir="rtl">
          <CardContent className="pt-6">
            <Input
              placeholder="بحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card dir="rtl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4 font-medium">اسم المستخدم</th>
                    <th className="text-right p-4 font-medium">الاسم الكامل</th>
                    <th className="text-right p-4 font-medium">الدور</th>
                    <th className="text-right p-4 font-medium">الحالة</th>
                    <th className="text-right p-4 font-medium">الإجراءات</th>
                  </tr>
                </thead>
              
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-12 w-12 mb-3 text-gray-400" />
                          <p className="text-lg font-medium">لا يوجد مستخدمين</p>
                          <p className="text-sm mt-1">ابدأ بإضافة مستخدم جديد</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.filter(userItem => 
                    userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    `${userItem.first_name} ${userItem.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="h-12 w-12 mb-3 text-gray-400" />
                          <p className="text-lg font-medium">لا توجد نتائج</p>
                          <p className="text-sm mt-1">لم يتم العثور على مستخدمين بهذا الاسم</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.filter(userItem => 
                      userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      `${userItem.first_name} ${userItem.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((userItem) => (
                      <tr key={userItem.id} className="border-b hover:bg-gray-50">
                        <td className="text-right p-4 font-medium">{userItem.username}</td>
                        <td className="text-right p-4">{`${userItem.first_name} ${userItem.last_name}`}</td>
                        <td className="text-right p-4">
                          <Badge className={getRoleColor(userItem.role)}>
                            {getRoleLabel(userItem.role)}
                          </Badge>
                        </td>
                        <td className="text-right p-4">
                          <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                            {userItem.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </td>
                        <td className="text-right p-4">
                          <div className="flex gap-2 justify-end">
                            {canManageUser(userItem) ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(userItem)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4 ml-1" />
                                  تعديل
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 ml-1" />
                                  حذف
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">لا توجد صلاحيات</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
              <DialogDescription>
                تحديث تفاصيل المستخدم
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_username">اسم المستخدم</Label>
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
                <div className="grid gap-2">
                  <Label htmlFor="edit_password">كلمة المرور الجديدة</Label>
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
                <div className="grid gap-2">
                  <Label htmlFor="edit_first_name">الاسم الأول</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="col-span-3"
                    placeholder="أدخل الاسم الأول"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_last_name">الاسم الأخير</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="col-span-3"
                    placeholder="أدخل الاسم الأخير"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_role">الدور</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">تحديث المستخدم</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default UserManagement