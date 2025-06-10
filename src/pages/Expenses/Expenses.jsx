import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Card,
  Typography,
  message,
  Popconfirm,
  Tag,
  Breadcrumb,
  Select,
  Input,
  Row,
  Col,
  Form,
  Statistic,
  Spin,
  Divider,
  Dropdown,
  Modal,
  Upload,
  DatePicker,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  DollarOutlined,
  FilterOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ImportOutlined,
  EllipsisOutlined,
  InboxOutlined,
  WalletOutlined,
  TagOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined
} from '@ant-design/icons';
import moment from 'moment';
import * as XLSX from 'xlsx';
import '../../styles/Expenses/Expenses.css';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';

const { Title, Text } = Typography;
const { Option } = Select;

const Expenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceOptions, setResourceOptions] = useState({
    employees: [],
    equipment: [],
    transportation: [],
    tools: [],
    spares: [],
    materials: []
  });
  const [summaryData, setSummaryData] = useState({
    total: 0,
    byType: [],
    byCategory: [],
    currentMonth: 0
  });
  
  // Новые состояния для навигации по месяцам
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [monthlyData, setMonthlyData] = useState({
    expenses: [],
    summary: {
      total: 0,
      byType: [],
      byCategory: [],
      count: 0
    }
  });
  
  const [filterValues, setFilterValues] = useState({
    dateRange: [moment().startOf('month'), moment()],
    resourceTypes: [],
    resourceIds: [],
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [resourceTypes, setResourceTypes] = useState([
    'Employee',
    'Equipment',
    'Transportation',
    'Tool',
    'Spare',
    'Material'
  ]);
  
  // Import/Export related state
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Fetch all required data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchExpenseCategories();
    fetchResourceOptions();
  }, []);
  
  // Fetch monthly data when selected month changes
  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);
  
  // Update filtered expenses when expenses, filters or search query change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [monthlyData.expenses, filterValues, searchQuery]);
  
  // Новая функция для получения данных за выбранный месяц
  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      const startDate = selectedMonth.clone().startOf('month').format('YYYY-MM-DD');
      const endDate = selectedMonth.clone().endOf('month').format('YYYY-MM-DD');
      
      // Получаем расходы за выбранный месяц
      const expensesResponse = await fetch(`/api/expenses?startDate=${startDate}&endDate=${endDate}`);
      if (!expensesResponse.ok) {
        throw new Error(`HTTP error! Status: ${expensesResponse.status}`);
      }
      const expensesData = await expensesResponse.json();
      
      // Получаем сводную информацию за месяц
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const [totalResponse, byTypeResponse, byCategoryResponse] = await Promise.all([
        fetch(`/api/expenses/summary/total?${params.toString()}`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=resource_type`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=category`).then(res => res.json())
      ]);
      
      const sortedCategories = [...byCategoryResponse].sort((a, b) => b.Total - a.Total);
      
      setMonthlyData({
        expenses: expensesData,
        summary: {
          total: totalResponse[0]?.Total || 0,
          byType: byTypeResponse || [],
          byCategory: sortedCategories || [],
          count: expensesData.length
        }
      });
      
    } catch (err) {
      message.error(`Не удалось загрузить данные за месяц: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция навигации по месяцам
  const handleMonthChange = (direction) => {
    const newMonth = selectedMonth.clone();
    if (direction === 'prev') {
      newMonth.subtract(1, 'month');
    } else {
      newMonth.add(1, 'month');
    }
    setSelectedMonth(newMonth);
    setCurrentPage(1); // Сбрасываем на первую страницу при смене месяца
  };
  
  // Функция для перехода к текущему месяцу
  const goToCurrentMonth = () => {
    setSelectedMonth(moment());
    setCurrentPage(1);
  };
  
  // Обновленная функция fetchExpenses (для общих данных)
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/expenses');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setExpenses(data);
      
      // Fetch summary data too
      fetchSummaryData();
    } catch (err) {
      message.error(`Failed to load expenses data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('BY', {
      style: 'currency',
      currency: 'BYN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };
  
  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    try {
      const response = await fetch('/api/expenses/categories/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.map(c => c.Name));
    } catch (err) {
      message.error(`Failed to load expense categories: ${err.message}`);
    }
  };
  
  // Fetch all resource options for the filters
  const fetchResourceOptions = async () => {
    try {
      // Fetch all resource types in parallel
      const [employees, equipment, transportation, tools, spares, materials] = await Promise.all([
        fetch('/api/employees').then(res => res.json()),
        fetch('/api/equipment').then(res => res.json()),
        fetch('/api/transportation').then(res => res.json()),
        fetch('/api/tools').then(res => res.json()),
        fetch('/api/spares').then(res => res.json()),
        fetch('/api/materials').then(res => res.json())
      ]);
      
      setResourceOptions({
        employees,
        equipment,
        transportation,
        tools,
        spares,
        materials
      });
    } catch (err) {
      message.error(`Failed to load resource options: ${err.message}`);
    }
  };
  
  // Обновленная функция fetchSummaryData (для общей статистики)
  const fetchSummaryData = async () => {
    try {
      // Construct query params for date range
      const params = new URLSearchParams();
      if (filterValues.dateRange && filterValues.dateRange[0]) {
        params.append('startDate', filterValues.dateRange[0].format('YYYY-MM-DD'));
      }
      if (filterValues.dateRange && filterValues.dateRange[1]) {
        params.append('endDate', filterValues.dateRange[1].format('YYYY-MM-DD'));
      }
      
      // Fetch current month data
      const currentMonthParams = new URLSearchParams();
      currentMonthParams.append('startDate', moment().startOf('month').format('YYYY-MM-DD'));
      currentMonthParams.append('endDate', moment().format('YYYY-MM-DD'));
      
      // Fetch summary data in parallel
      const [totalResponse, byTypeResponse, byCategoryResponse, currentMonthResponse] = await Promise.all([
        fetch(`/api/expenses/summary/total?${params.toString()}`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=resource_type`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${params.toString()}&groupBy=category`).then(res => res.json()),
        fetch(`/api/expenses/summary/total?${currentMonthParams.toString()}`).then(res => res.json())
      ]);
      
      // Сортировка категорий по сумме (Total) в порядке убывания
      const sortedCategories = [...byCategoryResponse].sort((a, b) => b.Total - a.Total);
      
      setSummaryData({
        total: totalResponse[0]?.Total || 0,
        byType: byTypeResponse || [],
        byCategory: sortedCategories || [],
        currentMonth: currentMonthResponse[0]?.Total || 0
      });
    } catch (err) {
      message.error(`Failed to load summary data: ${err.message}`);
    }
  };

  // Applying filters and search to the monthly expenses
  const applyFiltersAndSearch = () => {
    let filtered = [...monthlyData.expenses];
    
    // Apply resource type filter
    if (filterValues.resourceTypes.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceTypes.includes(expense.Resource_Type)
      );
    }
    
    // Apply resource ID filter
    if (filterValues.resourceIds.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceIds.includes(expense.Resource_ID)
      );
    }
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.categories.includes(expense.Category)
      );
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => {
        const resourceName = getResourceName(expense.Resource_Type, expense.Resource_ID).toLowerCase();
        
        return (
          (expense.Category && expense.Category.toLowerCase().includes(query)) ||
          resourceName.includes(query) ||
          (expense.Description && expense.Description.toLowerCase().includes(query)) ||
          (expense.Invoice_Number && expense.Invoice_Number.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredExpenses(filtered);
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };
  
  // Handle date range change for custom DateRangePicker
  const handleDateRangeChange = (dateRange) => {
    setFilterValues(prev => ({
      ...prev,
      dateRange: dateRange
    }));
  };
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterValues({
      dateRange: [moment().startOf('month'), moment()],
      resourceTypes: [],
      resourceIds: [],
      categories: []
    });
  };
  
  // Handle search query change
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Add new expense button handler
  const handleAddExpense = () => {
    navigate('/expenses/new');
  };
  
  // Edit expense handler
  const goToEditExpense = (id) => {
    navigate(`/expenses/edit/${id}`);
  };

  const handleGenerateReport = () => {
    navigate('/expenses/report');
  };
  
  // Delete expense handler
  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      message.success('Расход успешно удален!');
      fetchMonthlyData(); // Обновляем данные за месяц
    } catch (err) {
      message.error(`Не удалось удалить расход: ${err.message}`);
    }
  };
  
  // Page change handler for pagination
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };
  
  // Export expenses to Excel
  const exportToExcel = () => {
    try {
      // Create dataset for export
      const exportData = monthlyData.expenses.map(expense => {
        return {
          'Дата': moment(expense.Date).format('DD.MM.YYYY'),
          'Тип ресурса': getResourceTypeDisplayName(expense.Resource_Type),
          'Ресурс': getResourceName(expense.Resource_Type, expense.Resource_ID),
          'Категория': expense.Category || '',
          'Сумма': expense.Amount || 0,
          'Описание': expense.Description || 'Нет описания',
          'Способ оплаты': expense.Payment_Method || '',
          'Номер счета': expense.Invoice_Number || ''
        };
      });
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 12 }, // Дата
        { wch: 15 }, // Тип ресурса
        { wch: 25 }, // Ресурс
        { wch: 20 }, // Категория
        { wch: 15 }, // Сумма
        { wch: 30 }, // Описание
        { wch: 15 }, // Способ оплаты
        { wch: 15 }  // Номер счета
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Расходы');
      
      // Generate and download Excel file
      const filename = `Расходы_${selectedMonth.format('YYYY-MM')}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      message.success('Данные о расходах успешно экспортированы!');
    } catch (err) {
      message.error(`Не удалось экспортировать данные: ${err.message}`);
    }
  };
  
  // Open import modal
  const showImportModal = () => {
    setImportFileList([]);
    setImportError('');
    setImportModalVisible(true);
  };
  
  // Handle import file change
  const handleImportFileChange = (info) => {
    setImportFileList(info.fileList.slice(-1)); // Save only the last file
  };
  
  // Create template for download
  const downloadTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        'Дата': '01.05.2025',
        'Тип ресурса': 'Сотрудник',
        'Ресурс': 'Иванов Иван Иванович',
        'Категория': 'Зарплата',
        'Сумма': 5000,
        'Описание': 'Выплата аванса',
        'Способ оплаты': 'Банковский перевод',
        'Номер счета': 'INV-001'
      },
      {
        'Дата': '05.05.2025',
        'Тип ресурса': 'Транспорт',
        'Ресурс': 'Toyota Camry',
        'Категория': 'Топливо',
        'Сумма': 1200,
        'Описание': 'Заправка автомобиля',
        'Способ оплаты': 'Банковская карта',
        'Номер счета': 'INV-002'
      }
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const wscols = [
      { wch: 12 }, // Дата
      { wch: 15 }, // Тип ресурса
      { wch: 25 }, // Ресурс (расширил для наименований)
      { wch: 20 }, // Категория
      { wch: 15 }, // Сумма
      { wch: 30 }, // Описание
      { wch: 20 }, // Способ оплаты
      { wch: 15 }  // Номер счета
    ];
    worksheet['!cols'] = wscols;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
    
    // Download
    XLSX.writeFile(workbook, 'Шаблон_Импорта_Расходов.xlsx');
  };

  // Добавим функцию для поиска ID ресурса по его наименованию и типу
  const findResourceIdByName = (resourceType, resourceName) => {
    if (!resourceName || !resourceType) return null;
    
    const nameLower = resourceName.toLowerCase();
    
    switch(resourceType) {
      case 'Employee':
        const employee = resourceOptions.employees.find(e => 
          e.Full_Name && e.Full_Name.toLowerCase() === nameLower);
        return employee ? employee.Employee_ID : null;
        
      case 'Equipment':
        const equipment = resourceOptions.equipment.find(e => 
          e.Name && e.Name.toLowerCase() === nameLower);
        return equipment ? equipment.Equipment_ID : null;
        
      case 'Transportation':
        const transport = resourceOptions.transportation.find(t => {
          const fullName = `${t.Brand} ${t.Model}`.toLowerCase();
          return fullName === nameLower;
        });
        return transport ? transport.Transport_ID : null;
        
      case 'Tool':
        const tool = resourceOptions.tools.find(t => 
          t.Name && t.Name.toLowerCase() === nameLower);
        return tool ? tool.Tool_ID : null;
        
      case 'Spare':
        const spare = resourceOptions.spares.find(s => 
          s.Name && s.Name.toLowerCase() === nameLower);
        return spare ? spare.Spare_ID : null;
        
      case 'Material':
        const material = resourceOptions.materials.find(m => 
          m.Name && m.Name.toLowerCase() === nameLower);
        return material ? material.Material_ID : null;
        
      default:
        return null;
    }
  };

  // Обновление функции handleImport для работы с именами ресурсов вместо ID
  const handleImport = async () => {
    setImportError('');
    
    if (!importFileList || importFileList.length === 0) {
      setImportError('Пожалуйста, выберите Excel-файл для импорта');
      message.error('Пожалуйста, выберите Excel-файл для импорта');
      return;
    }

    const file = importFileList[0].originFileObj;
    
    if (!file) {
      setImportError('Неверный файловый объект');
      message.error('Неверный файловый объект');
      return;
    }
    
    setImporting(true);

    try {
      // Read Excel file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Parse Excel data
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          if (!worksheetName) {
            throw new Error('Excel-файл не содержит листов');
          }
          
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
          
          // Check data structure
          if (!jsonData || jsonData.length <= 1) { // Including header row
            throw new Error('Excel-файл пуст или содержит некорректные данные');
          }
          
          // Find header row and identify column positions
          const headerRow = jsonData[0];
          const columns = {
            date: Object.keys(headerRow).find(key => headerRow[key] === 'Дата'),
            resourceType: Object.keys(headerRow).find(key => headerRow[key] === 'Тип ресурса'),
            resourceName: Object.keys(headerRow).find(key => headerRow[key] === 'Ресурс'),
            category: Object.keys(headerRow).find(key => headerRow[key] === 'Категория'),
            amount: Object.keys(headerRow).find(key => headerRow[key] === 'Сумма'),
            description: Object.keys(headerRow).find(key => headerRow[key] === 'Описание'),
            paymentMethod: Object.keys(headerRow).find(key => headerRow[key] === 'Способ оплаты'),
            invoiceNumber: Object.keys(headerRow).find(key => headerRow[key] === 'Номер счета')
          };
          
          if (!columns.date || !columns.resourceType || !columns.resourceName || !columns.category || !columns.amount) {
            throw new Error('В Excel-файле отсутствуют обязательные столбцы');
          }
          
          // Map resource type names to actual values
          const resourceTypeMap = {
            'Сотрудник': 'Employee',
            'Оборудование': 'Equipment',
            'Транспорт': 'Transportation',
            'Инструмент': 'Tool',
            'Запчасть': 'Spare',
            'Материал': 'Material'
          };
          
          // Transform rows to our format, skipping header row
          const expenseItems = [];
          const errors = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Parse date from different formats
            let dateValue = row[columns.date];
            let parsedDate;
            
            if (typeof dateValue === 'string') {
              // Try different date formats
              const formats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];
              for (const format of formats) {
                const momentDate = moment(dateValue, format);
                if (momentDate.isValid()) {
                  parsedDate = momentDate.format('YYYY-MM-DD');
                  break;
                }
              }
            } else if (dateValue instanceof Date) {
              parsedDate = moment(dateValue).format('YYYY-MM-DD');
            }
            
            // Convert localized resource type to system value
            const resourceTypeValue = row[columns.resourceType];
            const resourceType = resourceTypeMap[resourceTypeValue] || resourceTypeValue;
            
            // Get the resource name and find its ID
            const resourceName = row[columns.resourceName];
            const resourceId = findResourceIdByName(resourceType, resourceName);
            
            if (!resourceId) {
              errors.push({
                row: i + 1,
                message: `Не удалось найти ресурс "${resourceName}" типа "${resourceTypeValue}"`
              });
              continue; // Skip this row if resource not found
            }
            
            expenseItems.push({
              resourceType: resourceType,
              resourceId: resourceId,
              amount: Number(row[columns.amount]) || 0,
              description: columns.description ? row[columns.description] || '' : '',
              date: parsedDate || moment().format('YYYY-MM-DD'),
              category: row[columns.category] || '',
              paymentMethod: columns.paymentMethod ? row[columns.paymentMethod] || '' : '',
              invoiceNumber: columns.invoiceNumber ? row[columns.invoiceNumber] || '' : ''
            });
          }
          
          // Filter invalid records (missing required fields)
          const validExpenses = expenseItems.filter(item => 
            item.resourceType && 
            item.resourceId && 
            item.amount > 0 && 
            item.date && 
            item.category
          );
          
          if (validExpenses.length === 0) {
            if (errors.length > 0) {
              throw new Error(`Не найдены совпадения для следующих записей:\n${errors.map(e => `Строка ${e.row}: ${e.message}`).join('\n')}`);
            } else {
              throw new Error('Действительные данные о расходах не найдены. Все обязательные поля должны быть заполнены.');
            }
          }
          
          // Import each expense one by one
          const results = [];
          for (const expense of validExpenses) {
            try {
              const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(expense)
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                results.push({
                  success: false,
                  error: errorData.error || 'Импорт не удался'
                });
              } else {
                results.push({ success: true });
              }
            } catch (err) {
              results.push({
                success: false,
                error: err.message
              });
            }
          }
          
          // Count successes and failures
          const successes = results.filter(r => r.success).length;
          const failures = results.length - successes;
          
          // Display warnings about rows that couldn't be matched
          if (errors.length > 0) {
            const errorMessage = `Предупреждение: ${errors.length} записей не удалось импортировать из-за несоответствия ресурсов.`;
            message.warning(errorMessage);
          }
          
          setImportModalVisible(false);
          
          if (failures === 0) {
            message.success(`Успешно импортировано ${successes} расходов`);
          } else {
            message.warning(`Импортировано ${successes} расходов, не удалось импортировать ${failures} записей`);
          }
          
          fetchMonthlyData(); // Обновляем данные за месяц
          
        } catch (err) {
          setImportError(`Импорт не удался: ${err.message}`);
          message.error(`Импорт не удался: ${err.message}`);
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = (error) => {
        setImportError('Не удалось прочитать файл');
        message.error('Не удалось прочитать файл');
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      setImportError(`Импорт не удался: ${err.message}`);
      message.error(`Импорт не удался: ${err.message}`);
      setImporting(false);
    }
  };

  // Get resource name by type and id
  const getResourceName = (type, id) => {
    if (!id) return '-';
    
    switch(type) {
      case 'Employee':
        return resourceOptions.employees.find(e => e.Employee_ID === id)?.Full_Name || `ID: ${id}`;
      case 'Equipment':
        return resourceOptions.equipment.find(e => e.Equipment_ID === id)?.Name || `ID: ${id}`;
      case 'Transportation':
        return resourceOptions.transportation.find(t => t.Transport_ID === id)?.Brand + ' ' + 
               resourceOptions.transportation.find(t => t.Transport_ID === id)?.Model || `ID: ${id}`;
      case 'Tool':
        return resourceOptions.tools.find(t => t.Tool_ID === id)?.Name || `ID: ${id}`;
      case 'Spare':
        return resourceOptions.spares.find(s => s.Spare_ID === id)?.Name || `ID: ${id}`;
      case 'Material':
        return resourceOptions.materials.find(m => m.Material_ID === id)?.Name || `ID: ${id}`;
      default:
        return `${type} ID: ${id}`;
    }
  };

  // Новая функция для получения данных ресурса с фото
  const getResourceWithPhoto = (type, id) => {
    if (!id) return { name: '-', photo: null };
    
    switch(type) {
      case 'Employee':
        const employee = resourceOptions.employees.find(e => e.Employee_ID === id);
        return {
          name: employee?.Full_Name || `ID: ${id}`,
          photo: employee?.Photo || null
        };
      case 'Equipment':
        return {
          name: resourceOptions.equipment.find(e => e.Equipment_ID === id)?.Name || `ID: ${id}`,
          photo: null
        };
      case 'Transportation':
        const transport = resourceOptions.transportation.find(t => t.Transport_ID === id);
        return {
          name: transport ? `${transport.Brand} ${transport.Model}` : `ID: ${id}`,
          photo: null
        };
      case 'Tool':
        return {
          name: resourceOptions.tools.find(t => t.Tool_ID === id)?.Name || `ID: ${id}`,
          photo: null
        };
      case 'Spare':
        return {
          name: resourceOptions.spares.find(s => s.Spare_ID === id)?.Name || `ID: ${id}`,
          photo: null
        };
      case 'Material':
        return {
          name: resourceOptions.materials.find(m => m.Material_ID === id)?.Name || `ID: ${id}`,
          photo: null
        };
      default:
        return {
          name: `${type} ID: ${id}`,
          photo: null
        };
    }
  };

  // Get resource type display name
  const getResourceTypeDisplayName = (type) => {
    const typeMap = {
      'Employee': 'Сотрудник',
      'Equipment': 'Оборудование',
      'Transportation': 'Транспорт',
      'Tool': 'Инструмент',
      'Spare': 'Запчасть',
      'Material': 'Материал'
    };
    return typeMap[type] || type;
  };
  
  // Define table columns
  const columns = [
    {
      title: 'Дата',
      dataIndex: 'Date',
      key: 'date',
      render: text => moment(text).format('DD.MM.YYYY'),
      sorter: (a, b) => moment(a.Date).unix() - moment(b.Date).unix(),
    },
    {
      title: 'Тип ресурса',
      dataIndex: 'Resource_Type',
      key: 'resourceType',
      render: text => getResourceTypeDisplayName(text)
    },
    {
      title: 'Ресурс',
      key: 'resource',
      render: record => {
        const resourceData = getResourceWithPhoto(record.Resource_Type, record.Resource_ID);
        
        // Если это сотрудник, показываем аватарку
        if (record.Resource_Type === 'Employee') {
          return (
            <Space>
              <Avatar 
                size="small" 
                src={resourceData.photo ? `data:image/jpeg;base64,${resourceData.photo}` : undefined} 
                icon={!resourceData.photo ? <UserOutlined /> : undefined} 
              />
              {resourceData.name}
            </Space>
          );
        }
        
        // Для остальных типов ресурсов просто показываем название
        return resourceData.name;
      }
    },
    {
      title: 'Категория',
      dataIndex: 'Category',
      key: 'category'
    },
    {
      title: 'Сумма',
      dataIndex: 'Amount',
      key: 'amount',
      render: amount => <Text>{formatCurrency(amount)}</Text>,
      sorter: (a, b) => a.Amount - b.Amount,
    },
    {
      title: 'Описание',
      dataIndex: 'Description',
      key: 'description',
      ellipsis: true,
      render: text => (
        <Text style={{ color: text ? 'inherit' : '#999' }}>
          {text || 'Нет описания'}
        </Text>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: 'Редактировать',
                icon: <EditOutlined />,
                onClick: () => goToEditExpense(record.Expense_ID)
              },
              {
                key: '2',
                label: 
                  <Popconfirm
                    title="Удаление расхода"
                    description="Вы уверены, что хотите удалить этот расход?"
                    onConfirm={() => handleDeleteExpense(record.Expense_ID)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <span className="dropdown-delete-label">Удалить</span>
                  </Popconfirm>,
                icon: <DeleteOutlined />,
                danger: true
              }
            ]
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<EllipsisOutlined  />}
            className="action-more-button"
          />
        </Dropdown>
      ),
    },
  ];

  // Get paginated data
  const paginatedData = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  return (
    <div className="expenses-page">
      {/* Breadcrumbs */}
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Расходы
        </Breadcrumb.Item>
      </Breadcrumb>
      
      {/* Навигация по месяцам */}
      <Card className="month-navigation-card">
        <div className="month-navigation">
          <Button 
            type="text" 
            icon={<LeftOutlined />} 
            onClick={() => handleMonthChange('prev')}
            className="month-nav-button"
          />
          <div className="month-display">
            <Title level={3} className="month-title">
              {selectedMonth.format('MMMM YYYY')}
            </Title>
            <Button 
              type="link" 
              onClick={goToCurrentMonth}
              className="current-month-button"
            >
              Текущий месяц
            </Button>
          </div>
          <Button 
            type="text" 
            icon={<RightOutlined />} 
            onClick={() => handleMonthChange('next')}
            className="month-nav-button"
          />
        </div>
      </Card>
      
      {/* Статистика по расходам за выбранный месяц */}
      <Row gutter={24} className="stats-row">
        <Col xs={24} sm={6}>
          <Card className="stat-card">
            <Statistic 
              title={
                <>
                  <span className="stat-card-icon">
                    <WalletOutlined />
                  </span>
                  Общая сумма
                </>
              } 
              value={monthlyData.summary.total} 
              precision={2}
              suffix={<span className="currency-suffix">BYN</span>}
              className="expense-stat"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card">
            <Statistic 
              title={
                <>
                  <span className="stat-card-icon">
                    <CalendarOutlined />
                  </span>
                  Количество записей
                </>
              } 
              value={monthlyData.summary.count} 
              className="expense-stat"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card">
            <Statistic 
              title={
                <>
                  <span className="stat-card-icon">
                    <TagOutlined />
                  </span>
                  Крупнейшая категория
                </>
              } 
              value={monthlyData.summary.byCategory[0]?.Total || 0} 
              precision={2}
              suffix={
                <>
                  <span className="currency-suffix">BYN</span>
                  {monthlyData.summary.byCategory[0] && (
                    <>
                      {' '}
                      <span className="stat-category">
                        {monthlyData.summary.byCategory[0].Category}
                      </span>
                    </>
                  )}
                </>
              }
              className="expense-stat"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="stat-card">
            <Statistic 
              title={
                <>
                  <span className="stat-card-icon">
                    <DollarOutlined />
                  </span>
                  Средний расход
                </>
              } 
              value={monthlyData.summary.count > 0 ? monthlyData.summary.total / monthlyData.summary.count : 0} 
              precision={2}
              suffix={<span className="currency-suffix">BYN</span>}
              className="expense-stat"
            />
          </Card>
        </Col>
      </Row>
      
      <Card>
        <div className="ant-page-header-wrapper">
          <div className="ant-page-header">
            {/* Left side: title with export and import buttons */}
            <div className="header-left-content">
              <Title level={2}>Расходы за {selectedMonth.format('MMMM YYYY')}</Title>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />} 
                onClick={exportToExcel}
                className="ant-export-button"
              >
                Экспорт
              </Button>
              <Button 
                type="primary" 
                icon={<ImportOutlined />} 
                onClick={showImportModal}
                className="ant-import-button"
              >
                Импорт
              </Button>
            </div>
            
            {/* Right side: filter, search, and add buttons */}
            <div className="header-right-content">
              {/* Filter button */}
              <Button
                type="primary" 
                icon={<FilterOutlined />}
                onClick={toggleFilters}
                className="ant-filter-button"
              >
                Фильтр
              </Button>
              
              {/* Report button */}
              <Button
                type="primary" 
                icon={<FileDoneOutlined />}
                onClick={handleGenerateReport}
                className="ant-report-button"
              >
                Создать отчёт
              </Button>
              
              {/* Search bar */}
              <div className="expenses-search-bar-container">
                <SearchBar 
                  onSearch={handleSearch} 
                  placeholder="Поиск расходов"
                  autoFocus={false}
                />
              </div>
              
              {/* Add expense button */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddExpense}
                className="ant-add-button"
              >
                Добавить расход
              </Button>
            </div>
          </div>
          
          {/* Filter panel */}
          {showFilters && (
            <div className={`filter-panel ${showFilters ? 'visible' : ''}`}>
              <div className="filter-panel-header">
                <h4>Фильтр расходов</h4>
                <Button 
                  className="ant-filreset-button"
                  type="link"
                  onClick={resetFilters}
                >
                  Сбросить все фильтры
                </Button>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* Resource type filter */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Тип ресурса</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите тип ресурса"
                      value={filterValues.resourceTypes}
                      onChange={(values) => handleFilterChange('resourceTypes', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {resourceTypes.map(type => (
                        <Option key={type} value={type}>
                          {getResourceTypeDisplayName(type)}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                
                {/* Category filter */}
                <Col xs={24} sm={12} md={8}>
                  <div className="filter-group">
                    <label>Категория</label>
                    <Select
                      mode="multiple"
                      placeholder="Выберите категорию"
                      value={filterValues.categories}
                      onChange={(values) => handleFilterChange('categories', values)}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      {categories.map(category => (
                        <Option key={category} value={category}>{category}</Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>
          )}
          
          <Divider />
          
          <Spin spinning={loading}>
            {/* Table without built-in pagination */}
            <Table 
              dataSource={paginatedData}
              columns={columns}
              rowKey="Expense_ID"
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: filteredExpenses.length === 0 && monthlyData.expenses.length === 0 
                  ? `Нет расходов за ${selectedMonth.format('MMMM YYYY')}`
                  : 'Нет данных, соответствующих фильтрам'
              }}
            />
            
            {/* Custom pagination component */}
            <Pagination
              totalItems={filteredExpenses.length}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              pageSizeOptions={[8, 20, 50]}
              initialPageSize={pageSize}
            />
          </Spin>
        </div>
      </Card>
      
      {/* Import modal */}
      <Modal
        title="Импорт расходов из Excel"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="template" onClick={downloadTemplate} style={{ float: 'left' }}>
            Скачать шаблон
          </Button>,
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importing}
            onClick={handleImport}
            disabled={importFileList.length === 0}
          >
            Импорт
          </Button>
        ]}
      >
        <div className="import-instructions">
          <p>Пожалуйста, загрузите Excel-файл со следующими столбцами:</p>
          <ul>
            <li><strong>Дата</strong> (обязательно, формат DD.MM.YYYY)</li>
            <li><strong>Тип ресурса</strong> (обязательно)</li>
            <li><strong>Ресурс</strong> (обязательно, полное наименование)</li>
            <li><strong>Категория</strong> (обязательно)</li>
            <li><strong>Сумма</strong> (обязательно)</li>
            <li>Описание</li>
            <li>Способ оплаты</li>
            <li>Номер счета</li>
          </ul>
        </div>

        {importError && (
          <div className="import-error" style={{ color: 'red', marginBottom: '10px' }}>
            Ошибка: {importError}
          </div>
        )}

        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={() => false} // Prevent automatic upload
          fileList={importFileList}
          onChange={handleImportFileChange}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите файл в эту область для загрузки</p>
          <p className="ant-upload-hint">
            Поддерживается загрузка одного Excel-файла. Убедитесь, что ваш файл содержит необходимые столбцы.
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default Expenses;