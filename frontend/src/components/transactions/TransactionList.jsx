import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit, 
  Trash2, 
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  isLoading 
}) {
  const navigate = useNavigate();
  
  // Estado para filtros y ordenación
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { symbol: currencySymbol } = useUserCurrency();
  
  // Obtener categorías y subcategorías únicas de las transacciones
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const uniqueSubcategories = [...new Set(transactions
    .filter(t => t.subcategory) // Filtrar solo las que tienen subcategoría
    .map(t => t.subcategory))];

  
  // Aplicar filtros y ordenación cuando cambian los parámetros
  useEffect(() => {
    let result = [...transactions];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term) ||
        (t.subcategory && t.subcategory.toLowerCase().includes(term))
      );
    }
    
    // Aplicar filtro de tipo
    if (typeFilter !== 'all') {
      result = result.filter(t => t.tipo === typeFilter);
    }
    
    // Aplicar filtro de categoría
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }
    
    // Aplicar filtro de subcategoría
    if (subcategoryFilter !== 'all') {
      result = result.filter(t => t.subcategory === subcategoryFilter);
    }
    
    // Aplicar ordenación
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'subcategory':
          // Manejar valores nulos o undefined en subcategoría
          const subA = a.subcategory || '';
          const subB = b.subcategory || '';
          comparison = subA.localeCompare(subB);
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTransactions(result);
  }, [transactions, searchTerm, typeFilter, categoryFilter, subcategoryFilter, sortBy, sortOrder]);
  
  // Manejar cambio de ordenación
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    // Mantener la ordenación actual
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: es });
  };
  
  // Renderizar icono de tipo de transacción
  const renderTypeIcon = (tipo) => {
    if (tipo === 'ingreso') {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (tipo === 'gasto') {
      return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
    } else if (tipo === 'ahorro') {
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"></path><path d="M2 9v1c0 1.1.9 2 2 2h1"></path><path d="M16 5h0"></path></svg>;
    } else if (tipo === 'retiro') {
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-orange-500"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"></path><path d="M2 9v1c0 1.1.9 2 2 2h1"></path><path d="M16 5h0"></path></svg>;
    } else {
      return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
    }
  };
  
  // Renderizar color de monto según tipo
  const getAmountColor = (tipo) => {
    if (tipo === 'ingreso') return 'text-green-600';
    if (tipo === 'ahorro') return 'text-blue-600';
    if (tipo === 'retiro') return 'text-orange-600';
    return 'text-red-600'; // gasto y otros
  };
  
  // Renderizar flecha de ordenación
  const renderSortArrow = (field) => {
    if (sortBy !== field) return null;
    
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  // Mostrar mensaje de carga o sin datos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No hay transacciones registradas</p>
        <Button onClick={() => navigate('/transactions/new')}>
          Agregar transacción
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar transacciones..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="ingreso">Ingresos</SelectItem>
              <SelectItem value="gasto">Gastos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={clearAllFilters} 
            title="Limpiar todos los filtros"
            className="h-10 w-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
            <span className="sr-only">Limpiar filtros</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Categoría</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Subcategoría</p>
                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las subcategorías</SelectItem>
                    {uniqueSubcategories.map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Ordenar por</p>
                <div className="space-y-1">
                  <DropdownMenuCheckboxItem
                    key="sort-date"
                    checked={sortBy === 'date'}
                    onCheckedChange={() => handleSortChange('date')}
                  >
                    Fecha
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    key="sort-amount"
                    checked={sortBy === 'amount'}
                    onCheckedChange={() => handleSortChange('amount')}
                  >
                    Monto
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    key="sort-description"
                    checked={sortBy === 'description'}
                    onCheckedChange={() => handleSortChange('description')}
                  >
                    Descripción
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    key="sort-category"
                    checked={sortBy === 'category'}
                    onCheckedChange={() => handleSortChange('category')}
                  >
                    Categoría
                  </DropdownMenuCheckboxItem>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Orden</p>
                <div className="space-y-1">
                  <DropdownMenuCheckboxItem
                    key="order-desc"
                    checked={sortOrder === 'desc'}
                    onCheckedChange={() => setSortOrder('desc')}
                  >
                    Descendente
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    key="order-asc"
                    checked={sortOrder === 'asc'}
                    onCheckedChange={() => setSortOrder('asc')}
                  >
                    Ascendente
                  </DropdownMenuCheckboxItem>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Lista de transacciones */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th key="header-date" className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => handleSortChange('date')}>
                <span className="flex items-center">
                  Fecha {renderSortArrow('date')}
                </span>
              </th>
              <th key="header-description" className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => handleSortChange('description')}>
                <span className="flex items-center">
                  Descripción {renderSortArrow('description')}
                </span>
              </th>
              <th key="header-category" className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => handleSortChange('category')}>
                <span className="flex items-center">
                  Categoría {renderSortArrow('category')}
                </span>
              </th>
              <th key="header-subcategory" className="px-4 py-3 text-left font-medium cursor-pointer" onClick={() => handleSortChange('subcategory')}>
                <span className="flex items-center">
                  Subcategoría {renderSortArrow('subcategory')}
                </span>
              </th>
              <th key="header-amount" className="px-4 py-3 text-right font-medium cursor-pointer" onClick={() => handleSortChange('amount')}>
                <span className="flex items-center justify-end">
                  Monto {renderSortArrow('amount')}
                </span>
              </th>
              <th key="header-actions" className="px-4 py-3 text-center font-medium">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {renderTypeIcon(transaction.tipo)}
                    <span className="ml-2">{formatDate(transaction.date)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {transaction.description}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                    {transaction.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {transaction.subcategory && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/50">
                        {transaction.subcategory}
                      </span>
                    )}
                    {transaction.goal_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="m16 8-8 8"></path><path d="m8 8 8 8"></path></svg>
                        Meta
                      </span>
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getAmountColor(transaction.tipo)}`}>
                  {currencySymbol}{transaction.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(transaction)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(transaction.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mensaje si no hay resultados */}
      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontraron transacciones con los filtros aplicados</p>
          <Button 
            variant="link" 
            onClick={clearAllFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
