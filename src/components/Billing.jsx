import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Edit, Check, Trash } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'

const formatDate = (iso = null) => {
  const d = iso ? new Date(iso) : new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// Expenses/debts are persisted via the test API (localStorage-backed)

const Billing = ({ user, onLogout }) => {
  const { i18n } = useTranslation()
  const [billings, setBillings] = useState([])
  const [loading, setLoading] = useState(true)

  // Expenses state (loaded from test API)
  const [expenses, setExpenses] = useState([])
  const [expEntity, setExpEntity] = useState('')
  const [expCount, setExpCount] = useState('')
  const [expTotal, setExpTotal] = useState('')
  const [editExpenseId, setEditExpenseId] = useState(null)
  const [editingExpense, setEditingExpense] = useState({})

  // Debts state (loaded from test API)
  const [debts, setDebts] = useState([])
  const [debtSupplier, setDebtSupplier] = useState('')
  const [debtValue, setDebtValue] = useState('')
  const [selectedDebtId, setSelectedDebtId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const [activeTab, setActiveTab] = useState('expenses')

  useEffect(() => {
    fetchBillings()
  }, [])

  // Load expenses & debts from test API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [exps, dbts] = await Promise.all([api.getExpenses(), api.getDebts()])
        setExpenses(exps || [])
        setDebts(dbts || [])
      } catch (e) {
        console.error('Failed to load expenses/debts', e)
      }
    }
    load()
  }, [])

  const fetchBillings = async () => {
    try {
      setLoading(true)
      const data = await api.getBillings()
      setBillings(data || [])
    } catch (err) {
      console.error(err)
      setBillings([])
    } finally {
      setLoading(false)
    }
  }

  // Expenses handlers
  const addExpense = async () => {
    if (!expEntity.trim() || !expTotal) {
      toast.error('الجهة/الصنف و التكلفة الكلية مطلوبان')
      return
    }
    const item = {
      id: Date.now(),
      entity: expEntity.trim(),
      count: expCount ? Number(expCount) : null,
      total: Number(expTotal),
      created_at: new Date().toISOString()
    }
    try {
      const res = await api.createExpense(item)
      setExpenses((s) => [res, ...s])
    } catch (err) {
      console.error(err)
      toast.error('فشل حفظ المصاريف')
    }
    setExpEntity('')
    setExpCount('')
    setExpTotal('')
  }

  const startEditExpense = (id) => {
    const e = expenses.find((x) => x.id === id)
    if (!e) return
    setEditExpenseId(id)
    setEditingExpense({ ...e })
  }

  const saveEditExpense = () => {
    const save = async () => {
      try {
        const updated = await api.updateExpense(editExpenseId, editingExpense)
        setExpenses((arr) => arr.map((it) => (it.id === editExpenseId ? { ...it, ...updated } : it)))
      } catch (err) {
        console.error(err)
        toast.error('فشل تحديث المصاريف')
      } finally {
        setEditExpenseId(null)
        setEditingExpense({})
      }
    }
    save()
  }

  const removeExpense = (id) => {
    const remove = async () => {
      try {
        await api.deleteExpense(id)
        setExpenses((s) => s.filter((x) => x.id !== id))
      } catch (err) {
        console.error(err)
        toast.error('فشل حذف المصاريف')
      }
    }
    remove()
  }

  // Debts handlers
  const addDebt = async () => {
    if (!debtSupplier.trim() || !debtValue) {
      toast.error('اسم المورد و قيمة الدين مطلوبان')
      return
    }
    const d = {
      id: Date.now(),
      supplier: debtSupplier.trim(),
      value: Number(debtValue),
      created_at: new Date().toISOString(),
      payments: [{ amount: 0, date: new Date().toISOString() }]
    }
    try {
      const res = await api.createDebt(d)
      setDebts((s) => [res, ...s])
      setDebtSupplier('')
      setDebtValue('')
      setSelectedDebtId(res.id)
      setActiveTab('debts')
    } catch (err) {
      console.error(err)
      toast.error('فشل حفظ المديونية')
    }
  }

  const addPayment = (debtId, amount) => {
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      toast.error('أدخل قيمة سداد صحيحة')
      return
    }
    const apply = async () => {
      try {
        const updated = await api.addDebtPayment(debtId, { amount: amt, date: new Date().toISOString() })
        setDebts((arr) => arr.map((d) => (d.id === updated.id ? updated : d)))
      } catch (err) {
        console.error(err)
        toast.error('فشل تسجيل السداد')
      } finally {
        setPaymentAmount('')
      }
    }
    apply()
  }

  const getDebtRemaining = (d) => {
    const paid = (d.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    return Math.max(0, Number(d.value || 0) - paid)
  }

  // Totals
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.total || 0), 0)
  const totalDebtsRemaining = debts.reduce((s, d) => s + getDebtRemaining(d), 0)

  // Include deposits in total revenue (total + deposit) so deposits are counted as income
  const totalRevenue = billings.reduce((s, b) => s + (Number(b.total || 0) + Number(b.deposit || 0)), 0)

  // Net profit: إجمالي الإيرادات - إجمالي المصاريف - إجمالي المديونية
  const netProfit = totalRevenue - totalExpenses - totalDebtsRemaining

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title="المديونيات والمصاريف">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} title="المديونيات والمصاريف">
      <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي المديونية</p>
                  <p className="text-2xl font-bold">${totalDebtsRemaining.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">صافي الربح</p>
                  <p className="text-2xl font-bold">${netProfit.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <span>المديونيات والمصاريف</span>
                </CardTitle>
                <CardDescription>
                  سجل المصاريف والديون وقم بإدارة سداد المديونيات
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">المصاريف و التكاليف</TabsTrigger>
                <TabsTrigger value="debts">المديونيات</TabsTrigger>
              </TabsList>

              <TabsContent value="expenses">
                <div className="flex gap-2 items-end mb-4">
                  <div className="flex-1">
                    <Label>الجهه/الصنف</Label>
                    <Input value={expEntity} onChange={(e)=>setExpEntity(e.target.value)} placeholder="الجهه أو الصنف" />
                  </div>
                  <div style={{width:120}}>
                    <Label>العدد</Label>
                    <Input value={expCount} onChange={(e)=>setExpCount(e.target.value)} placeholder="اختياري" />
                  </div>
                  <div style={{width:160}}>
                    <Label>التكلفة الكلية</Label>
                    <Input value={expTotal} type="number" onChange={(e)=>setExpTotal(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <Button onClick={addExpense} className="mt-6">اضافة</Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الجهه/الصنف</TableHead>
                        <TableHead>العدد</TableHead>
                        <TableHead>التكلفة الكلية</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            {editExpenseId === e.id ? (
                              <Input value={editingExpense.entity} onChange={(ev)=>setEditingExpense({...editingExpense, entity: ev.target.value})} />
                            ) : e.entity}
                          </TableCell>
                          <TableCell>
                            {editExpenseId === e.id ? (
                              <Input value={editingExpense.count || ''} onChange={(ev)=>setEditingExpense({...editingExpense, count: ev.target.value})} />
                            ) : e.count ?? '-'}
                          </TableCell>
                          <TableCell>
                            {editExpenseId === e.id ? (
                              <Input value={editingExpense.total} type="number" onChange={(ev)=>setEditingExpense({...editingExpense, total: ev.target.value})} />
                            ) : `$${Number(e.total).toFixed(2)}`}
                          </TableCell>
                          <TableCell>{formatDate(e.created_at)}</TableCell>
                          <TableCell className="flex gap-2">
                            {editExpenseId === e.id ? (
                              <>
                                <Button onClick={saveEditExpense}><Check className="h-4 w-4" /></Button>
                                <Button variant="outline" onClick={()=>{ setEditExpenseId(null); setEditingExpense({}); }}>الغاء</Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={()=>startEditExpense(e.id)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" onClick={()=>removeExpense(e.id)}><Trash className="h-4 w-4" /></Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">لا توجد مصاريف حتى الآن</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3 text-right font-semibold">إجمالي المصاريف: ${totalExpenses.toFixed(2)}</div>
              </TabsContent>

              <TabsContent value="debts">
                <div className="flex gap-2 items-end mb-4">
                  <div className="flex-1">
                    <Label>اسم المورد</Label>
                    <Input value={debtSupplier} onChange={(e)=>setDebtSupplier(e.target.value)} placeholder="اسم المورد" />
                  </div>
                  <div style={{width:200}}>
                    <Label>قيمة الدين</Label>
                    <Input value={debtValue} type="number" onChange={(e)=>setDebtValue(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <Button onClick={addDebt} className="mt-6">اضافة</Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead>المورد</TableHead>
                          <TableHead>قيمة المديونية</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {debts.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.supplier}</TableCell>
                          <TableCell>${getDebtRemaining(d).toFixed(2)}</TableCell>
                          <TableCell>{formatDate(d.created_at)}</TableCell>
                          <TableCell>
                            <Button onClick={() => { setSelectedDebtId(d.id); }}>
                              سداد
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {debts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">لا توجد مديونيات حتى الآن</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3">
                  <div className="font-semibold">إجمالي المديونية (المتبقي): ${totalDebtsRemaining.toFixed(2)}</div>
                </div>

                {/* Selected debt payment / history view */}
                {selectedDebtId && (() => {
                  const d = debts.find((x) => x.id === selectedDebtId)
                  if (!d) return null
                  const remaining = getDebtRemaining(d)
                  return (
                    <div className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>سداد - {d.supplier}</CardTitle>
                          <CardDescription>سجل السداد و تاريخ كل دفعة</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 items-end mb-4">
                            <div style={{width:200}}>
                              <Label>قيمة السداد</Label>
                              <Input value={paymentAmount} type="number" onChange={(e)=>setPaymentAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                              <Button onClick={() => addPayment(d.id, paymentAmount)} className="mt-6">اضافة سداد</Button>
                            </div>
                            <div className="flex-1 text-right mt-6">
                              <div className="font-semibold">المتبقي الآن: ${remaining.toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>المورد</TableHead>
                                  <TableHead>المتبقي</TableHead>
                                  <TableHead>التاريخ</TableHead>
                                  <TableHead>قيمة السداد</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(d.payments || []).map((p, idx) => {
                                  const paidUntilIdx = (d.payments || []).slice(0, idx + 1).reduce((s, pi) => s + Number(pi.amount || 0), 0)
                                  const remainingAfter = Math.max(0, Number(d.value || 0) - paidUntilIdx)
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>{d.supplier}</TableCell>
                                      <TableCell>${remainingAfter.toFixed(2)}</TableCell>
                                      <TableCell>{formatDate(p.date)}</TableCell>
                                      <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="mt-3 text-right font-semibold">المتبقي: ${getDebtRemaining(d).toFixed(2)}</div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default Billing
