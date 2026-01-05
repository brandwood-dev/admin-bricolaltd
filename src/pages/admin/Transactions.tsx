import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Label } from '@/components/ui/label'
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

// Import types from the entities bridge
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  PaginationMeta,
} from '@/types/unified-bridge'

// Extended interface for admin-specific transaction data
interface TransactionData extends Transaction {
  userName: string
  userEmail: string
  toolName?: string
  fees: number
  netAmount: number
  paymentProvider: string
  referenceId: string
  disputeReason?: string
  disputeStatus?: 'open' | 'investigating' | 'resolved' | 'closed'
}

import { transactionsService } from '@/services/transactionsService'
import { useToast } from '@/hooks/use-toast'

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const startISO = dateRange?.from
          ? new Date(
              dateRange.from.getFullYear(),
              dateRange.from.getMonth(),
              dateRange.from.getDate(),
              0,
              0,
              0,
              0
            ).toISOString()
          : undefined
        const endISO = dateRange?.to
          ? new Date(
              dateRange.to.getFullYear(),
              dateRange.to.getMonth(),
              dateRange.to.getDate(),
              23,
              59,
              59,
              999
            ).toISOString()
          : undefined

        const statusParam =
          statusFilter !== 'all'
            ? statusFilter === 'pending'
              ? TransactionStatus.PENDING
              : statusFilter === 'failed'
              ? TransactionStatus.FAILED
              : statusFilter === 'completed'
              ? TransactionStatus.COMPLETED
              : undefined
            : undefined
        const typeParam =
          typeFilter !== 'all'
            ? typeFilter === 'refund'
              ? TransactionType.REFUND
              : typeFilter === 'payment'
              ? TransactionType.PAYMENT
              : typeFilter === 'withdrawal'
              ? TransactionType.WITHDRAWAL
              : undefined
            : undefined

        const filters = {
          search: searchQuery || undefined,
          status: statusParam,
          type: typeParam,
          startDate: startISO,
          endDate: endISO,
          page: currentPage,
          limit: itemsPerPage,
        }

        const transactionsResponse = await transactionsService.getTransactions(
          filters
        )
        if (transactionsResponse.success) {
          const payload: any = transactionsResponse.data || {}
          const list = payload.data || []
          const metaFromFields = payload.meta || {
            page: payload.page,
            limit: payload.limit,
            total: payload.total,
            totalPages: payload.totalPages,
          }
          setTransactions(list)
          setMeta(metaFromFields || null)
        } else {
          console.error('Failed to load transactions')
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [
    searchQuery,
    statusFilter,
    typeFilter,
    dateRange,
    currentPage,
    itemsPerPage,
  ])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter, dateRange])

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig = {
      [TransactionStatus.COMPLETED]: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      [TransactionStatus.PENDING]: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      [TransactionStatus.FAILED]: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      [TransactionStatus.CANCELLED]: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
      },
    }

    const config =
      statusConfig[status] || statusConfig[TransactionStatus.PENDING]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className='w-3 h-3 mr-1' />
        {status === TransactionStatus.COMPLETED
          ? 'Terminée'
          : status === TransactionStatus.PENDING
          ? 'En attente'
          : status === TransactionStatus.FAILED
          ? 'Échoué'
          : status === TransactionStatus.CANCELLED
          ? 'Annulé'
          : String(status)}
      </Badge>
    )
  }

  const getTypeBadge = (type: TransactionType | string) => {
    const typeConfig = {
      [TransactionType.PAYMENT]: {
        color: 'bg-blue-100 text-blue-800',
        icon: CreditCard,
      },
      [TransactionType.REFUND]: {
        color: 'bg-purple-100 text-purple-800',
        icon: RefreshCw,
      },
      [TransactionType.WITHDRAWAL]: {
        color: 'bg-red-100 text-red-800',
        icon: TrendingDown,
      },
      [TransactionType.DEPOSIT]: {
        color: 'bg-green-100 text-green-800',
        icon: TrendingUp,
      },
    }

    const upperType = String(type).toUpperCase()
    const isIncome = upperType === 'PAYMENT' || upperType === 'RENTAL_INCOME'
    const config = isIncome
      ? typeConfig[TransactionType.PAYMENT]
      : typeConfig[type as TransactionType] ||
        typeConfig[TransactionType.PAYMENT]
    const Icon = config.icon

    return (
      <Badge variant='outline' className={config.color}>
        <Icon className='w-3 h-3 mr-1' />
        {upperType === 'PAYMENT' || upperType === 'RENTAL_INCOME'
          ? 'Réception'
          : upperType === 'REFUND'
          ? 'Remboursement'
          : String(type)}
      </Badge>
    )
  }

  const displayedTransactions = transactions
  const totalPages = meta?.totalPages || 1

  const exportTransactions = () => {
    const rows = displayedTransactions
      .map(
        (t) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${t.id}</td>
        <td style="padding:8px;border:1px solid #ddd;">${
          t.type === TransactionType.REFUND
            ? 'Admin'
            : t.sender?.name ||
              `${t.sender?.firstName || ''} ${t.sender?.lastName || ''}` ||
              'N/A'
        }</td>
        <td style="padding:8px;border:1px solid #ddd;">${
          t.type === TransactionType.PAYMENT ? 'Réception' : 'Remboursement'
        }</td>
        <td style="padding:8px;border:1px solid #ddd;">£ ${Number(
          t.amount
        )}</td>
        <td style="padding:8px;border:1px solid #ddd;">${
          t.status === TransactionStatus.COMPLETED
            ? 'Terminée'
            : t.status === TransactionStatus.PENDING
            ? 'En attente'
            : t.status === TransactionStatus.FAILED
            ? 'Échoué'
            : t.status === TransactionStatus.CANCELLED
            ? 'Annulé'
            : String(t.status)
        }</td>
        <td style="padding:8px;border:1px solid #ddd;">${
          t.paymentMethod || ''
        }</td>
        <td style="padding:8px;border:1px solid #ddd;">${new Date(
          t.createdAt
        ).toLocaleDateString()}</td>
      </tr>`
      )
      .join('')
    const html = `
      <html>
        <head>
          <title>Transactions</title>
        </head>
        <body>
          <h2>Transactions</h2>
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;">ID de transaction</th>
                <th style="padding:8px;border:1px solid #ddd;">Utilisateur</th>
                <th style="padding:8px;border:1px solid #ddd;">Type</th>
                <th style="padding:8px;border:1px solid #ddd;">Montant</th>
                <th style="padding:8px;border:1px solid #ddd;">Statut</th>
                <th style="padding:8px;border:1px solid #ddd;">Méthode de paiement</th>
                <th style="padding:8px;border:1px solid #ddd;">Date</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>`
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='w-8 h-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Transactions</h1>
          <p className='text-muted-foreground'>
            Gérer les transactions financières
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={exportTransactions} variant='outline'>
            <Download className='w-4 h-4 mr-2' />
            Exporter en PDF
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>
      {/* Filters */}
      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Input
                  placeholder='Rechercher des transactions par ID ou utilisateur ...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = searchTerm.trim()
                      setSearchQuery(q.length >= 3 ? q : '')
                      setCurrentPage(1)
                    }
                  }}
                  className='pr-8'
                />
                <button
                  type='button'
                  onClick={() => {
                    const q = searchTerm.trim()
                    setSearchQuery(q.length >= 3 ? q : '')
                    setCurrentPage(1)
                  }}
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary'
                >
                  <Search className='h-4 w-4 text-orange-500' />
                </button>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filtrer par statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='pending'>En attente</SelectItem>
                <SelectItem value='failed'>Échoué</SelectItem>
                <SelectItem value='completed'>Terminée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filtrer par type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les types</SelectItem>
                <SelectItem value={'payment'}>Réception</SelectItem>
                <SelectItem value={'refund'}>Remboursement</SelectItem>
                <SelectItem value={'withdrawal'}>Retrait</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Button
              className='sr-only'
              variant='outline'
              onClick={() => {
                const q = searchTerm.trim()
                setSearchQuery(q.length >= 3 ? q : '')
                setCurrentPage(1)
              }}
            >
              <Search className='w-4 h-4 mr-2' />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className='pt-6'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID de transaction</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Méthode de paiement</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-muted-foreground'
                  >
                    Aucune transaction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                displayedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className='font-medium'>
                      {transaction.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {transaction.type === TransactionType.REFUND
                            ? 'Admin'
                            : `${transaction.sender?.firstName} ${transaction.sender?.lastName}`}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {transaction.type === TransactionType.REFUND
                            ? ''
                            : transaction.sender?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell>
                      <div className='font-medium'>
                        £{Number(transaction.amount)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className='flex items-center justify-between space-x-2 py-4'>
            <div className='text-sm text-muted-foreground'>
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
              {Math.min(
                (currentPage - 1) * itemsPerPage + displayedTransactions.length,
                meta?.total || displayedTransactions.length
              )}{' '}
              sur {meta?.total ?? displayedTransactions.length} transactions
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' />
                Précédent
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Transactions
