import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Select,
  Card,
  Typography,
  message,
  Breadcrumb,
  Space,
  Divider,
  Row,
  Col,
  Spin,
  Table,
  Checkbox
} from 'antd';
import {
  HomeOutlined,
  FileWordOutlined,
  ArrowLeftOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import moment from 'moment';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import '../../styles/Expenses/ExpenseDocx.css';

// Импортируем библиотеку для создания docx документов
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, TextRun, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { Option } = Select;

const ExpenseDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment()]);
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'resourceType', 'resource', 'category', 'amount'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    resourceTypes: [],
    categories: []
  });

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchExpenses(),
      fetchExpenseCategories(),
      fetchResourceOptions()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered expenses when expenses change or filters change
  useEffect(() => {
    applyFilters();
  }, [expenses, dateRange, filterValues]);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expenses');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setExpenses(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о расходах: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
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
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить категории расходов: ${err.message}`);
      return [];
    }
  };

  // Fetch all resource options
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
      return { employees, equipment, transportation, tools, spares, materials };
    } catch (err) {
      message.error(`Не удалось загрузить данные о ресурсах: ${err.message}`);
      return null;
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

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Apply filters to expenses
  const applyFilters = () => {
    let filtered = [...expenses];
    
    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(expense => {
        const expenseDate = moment(expense.Date);
        return expenseDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply resource type filter
    if (filterValues.resourceTypes.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceTypes.includes(expense.Resource_Type)
      );
    }
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.categories.includes(expense.Category)
      );
    }
    
    setFilteredExpenses(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate total and summaries
      const total = filteredExpenses.reduce((sum, expense) => sum + (expense.Amount || 0), 0);
      
      // Group by resource type
      const resourceTypeSummary = {};
      filteredExpenses.forEach(expense => {
        const typeName = getResourceTypeDisplayName(expense.Resource_Type);
        if (!resourceTypeSummary[typeName]) {
          resourceTypeSummary[typeName] = 0;
        }
        resourceTypeSummary[typeName] += expense.Amount || 0;
      });

      // Group by category
      const categorySummary = {};
      filteredExpenses.forEach(expense => {
        const category = expense.Category || 'Без категории';
        if (!categorySummary[category]) {
          categorySummary[category] = 0;
        }
        categorySummary[category] += expense.Amount || 0;
      });

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Отчёт о расходах",
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  before: 200,
                  after: 200
                }
              }),
              new Paragraph({
                text: `За период: ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}`,
                spacing: {
                  before: 100,
                  after: 400
                }
              }),
              
              // Summary section
              ...(includeSummary ? [
                new Paragraph({
                  text: "Сводная информация",
                  heading: HeadingLevel.HEADING_2,
                  spacing: {
                    before: 200,
                    after: 200
                  }
                }),
                new Paragraph({
                  text: `Общая сумма расходов: ${formatCurrency(total)}`,
                  spacing: {
                    before: 100,
                    after: 100
                  }
                }),
                
                // Resource type summary
                new Paragraph({
                  text: "Расходы по типам ресурсов:",
                  spacing: {
                    before: 200,
                    after: 100
                  }
                }),
                new DocxTable({
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph("Тип ресурса")],
                          width: {
                            size: 50,
                            type: "percentage"
                          }
                        }),
                        new TableCell({
                          children: [new Paragraph("Сумма")],
                          width: {
                            size: 50,
                            type: "percentage"
                          }
                        })
                      ]
                    }),
                    ...Object.entries(resourceTypeSummary).map(([type, amount]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(type)]
                          }),
                          new TableCell({
                            children: [new Paragraph(formatCurrency(amount))]
                          })
                        ]
                      })
                    )
                  ]
                }),
                
                // Category summary
                new Paragraph({
                  text: "Расходы по категориям:",
                  spacing: {
                    before: 200,
                    after: 100
                  }
                }),
                new DocxTable({
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph("Категория")],
                          width: {
                            size: 50,
                            type: "percentage"
                          }
                        }),
                        new TableCell({
                          children: [new Paragraph("Сумма")],
                          width: {
                            size: 50,
                            type: "percentage"
                          }
                        })
                      ]
                    }),
                    ...Object.entries(categorySummary).map(([category, amount]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(category)]
                          }),
                          new TableCell({
                            children: [new Paragraph(formatCurrency(amount))]
                          })
                        ]
                      })
                    )
                  ]
                })
              ] : []),
              
              // Details section
              ...(includeDetails ? [
                new Paragraph({
                  text: "Детализация расходов",
                  heading: HeadingLevel.HEADING_2,
                  spacing: {
                    before: 400,
                    after: 200
                  }
                }),
                new DocxTable({
                  rows: [
                    new TableRow({
                      children: [
                        ...(selectedColumns.includes('date') ? [
                          new TableCell({
                            children: [new Paragraph("Дата")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('resourceType') ? [
                          new TableCell({
                            children: [new Paragraph("Тип ресурса")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('resource') ? [
                          new TableCell({
                            children: [new Paragraph("Ресурс")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('category') ? [
                          new TableCell({
                            children: [new Paragraph("Категория")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('amount') ? [
                          new TableCell({
                            children: [new Paragraph("Сумма")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('description') ? [
                          new TableCell({
                            children: [new Paragraph("Описание")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('paymentMethod') ? [
                          new TableCell({
                            children: [new Paragraph("Способ оплаты")]
                          })
                        ] : []),
                        ...(selectedColumns.includes('invoiceNumber') ? [
                          new TableCell({
                            children: [new Paragraph("Номер счета")]
                          })
                        ] : [])
                      ]
                    }),
                    ...filteredExpenses.map(expense => 
                      new TableRow({
                        children: [
                          ...(selectedColumns.includes('date') ? [
                            new TableCell({
                              children: [new Paragraph(moment(expense.Date).format('DD.MM.YYYY'))]
                            })
                          ] : []),
                          ...(selectedColumns.includes('resourceType') ? [
                            new TableCell({
                              children: [new Paragraph(getResourceTypeDisplayName(expense.Resource_Type))]
                            })
                          ] : []),
                          ...(selectedColumns.includes('resource') ? [
                            new TableCell({
                              children: [new Paragraph(getResourceName(expense.Resource_Type, expense.Resource_ID))]
                            })
                          ] : []),
                          ...(selectedColumns.includes('category') ? [
                            new TableCell({
                              children: [new Paragraph(expense.Category || '')]
                            })
                          ] : []),
                          ...(selectedColumns.includes('amount') ? [
                            new TableCell({
                              children: [new Paragraph(formatCurrency(expense.Amount))]
                            })
                          ] : []),
                          ...(selectedColumns.includes('description') ? [
                            new TableCell({
                              children: [new Paragraph(expense.Description || '')]
                            })
                          ] : []),
                          ...(selectedColumns.includes('paymentMethod') ? [
                            new TableCell({
                              children: [new Paragraph(expense.Payment_Method || '')]
                            })
                          ] : []),
                          ...(selectedColumns.includes('invoiceNumber') ? [
                            new TableCell({
                              children: [new Paragraph(expense.Invoice_Number || '')]
                            })
                          ] : [])
                        ]
                      })
                    )
                  ]
                })
              ] : []),
              
              // Footer
              new Paragraph({
                text: `Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}`,
                spacing: {
                  before: 400,
                  after: 0
                }
              })
            ]
          }
        ]
      });

      // Generate and save document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Отчёт_о_расходах_${moment().format('YYYY-MM-DD')}.docx`);
        message.success('Отчёт успешно сформирован!');
      });
    } catch (err) {
      message.error(`Ошибка при формировании отчёта: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle print preview
  const handlePrintPreview = () => {
    // Create a print-friendly version using CSS media queries
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      message.error('Открытие окна предварительного просмотра заблокировано. Проверьте настройки блокировки всплывающих окон.');
      return;
    }
    
    const total = filteredExpenses.reduce((sum, expense) => sum + (expense.Amount || 0), 0);
    
    // Group by resource type
    const resourceTypeSummary = {};
    filteredExpenses.forEach(expense => {
      const typeName = getResourceTypeDisplayName(expense.Resource_Type);
      if (!resourceTypeSummary[typeName]) {
        resourceTypeSummary[typeName] = 0;
      }
      resourceTypeSummary[typeName] += expense.Amount || 0;
    });
    
    // Group by category
    const categorySummary = {};
    filteredExpenses.forEach(expense => {
      const category = expense.Category || 'Без категории';
      if (!categorySummary[category]) {
        categorySummary[category] = 0;
      }
      categorySummary[category] += expense.Amount || 0;
    });

    // Generate HTML content
    printWindow.document.write(`
      <html>
        <head>
          <title>Отчёт о расходах</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.5;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            h2 {
              font-size: 20px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .summary-info {
              margin-bottom: 15px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div style="text-align: right;">
            <button onclick="window.print()">Печать</button>
          </div>
          <h1>Отчёт о расходах</h1>
          <p>За период: ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}</p>
          
          ${includeSummary ? `
            <h2>Сводная информация</h2>
            <p class="summary-info">Общая сумма расходов: ${formatCurrency(total)}</p>
            
            <h3>Расходы по типам ресурсов:</h3>
            <table>
              <tr>
                <th>Тип ресурса</th>
                <th>Сумма</th>
              </tr>
              ${Object.entries(resourceTypeSummary).map(([type, amount]) => `
                <tr>
                  <td>${type}</td>
                  <td>${formatCurrency(amount)}</td>
                </tr>
              `).join('')}
            </table>
            
            <h3>Расходы по категориям:</h3>
            <table>
              <tr>
                <th>Категория</th>
                <th>Сумма</th>
              </tr>
              ${Object.entries(categorySummary).map(([category, amount]) => `
                <tr>
                  <td>${category}</td>
                  <td>${formatCurrency(amount)}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          
          ${includeDetails ? `
            <h2>Детализация расходов</h2>
            <table>
              <tr>
                ${selectedColumns.includes('date') ? '<th>Дата</th>' : ''}
                ${selectedColumns.includes('resourceType') ? '<th>Тип ресурса</th>' : ''}
                ${selectedColumns.includes('resource') ? '<th>Ресурс</th>' : ''}
                ${selectedColumns.includes('category') ? '<th>Категория</th>' : ''}
                ${selectedColumns.includes('amount') ? '<th>Сумма</th>' : ''}
                ${selectedColumns.includes('description') ? '<th>Описание</th>' : ''}
                ${selectedColumns.includes('paymentMethod') ? '<th>Способ оплаты</th>' : ''}
                ${selectedColumns.includes('invoiceNumber') ? '<th>Номер счета</th>' : ''}
              </tr>
              ${filteredExpenses.map(expense => `
                <tr>
                  ${selectedColumns.includes('date') ? `<td>${moment(expense.Date).format('DD.MM.YYYY')}</td>` : ''}
                  ${selectedColumns.includes('resourceType') ? `<td>${getResourceTypeDisplayName(expense.Resource_Type)}</td>` : ''}
                  ${selectedColumns.includes('resource') ? `<td>${getResourceName(expense.Resource_Type, expense.Resource_ID)}</td>` : ''}
                  ${selectedColumns.includes('category') ? `<td>${expense.Category || ''}</td>` : ''}
                  ${selectedColumns.includes('amount') ? `<td>${formatCurrency(expense.Amount)}</td>` : ''}
                  ${selectedColumns.includes('description') ? `<td>${expense.Description || ''}</td>` : ''}
                  ${selectedColumns.includes('paymentMethod') ? `<td>${expense.Payment_Method || ''}</td>` : ''}
                  ${selectedColumns.includes('invoiceNumber') ? `<td>${expense.Invoice_Number || ''}</td>` : ''}
                </tr>
              `).join('')}
            </table>
          ` : ''}
          
          <div class="footer">
            Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Handle form submission
  const handleFormSubmit = () => {
    handleDownloadDocx();
  };

  // Get resource type options
  const resourceTypeOptions = [
    { value: 'Employee', label: 'Сотрудник' },
    { value: 'Equipment', label: 'Оборудование' },
    { value: 'Transportation', label: 'Транспорт' },
    { value: 'Tool', label: 'Инструмент' },
    { value: 'Spare', label: 'Запчасть' },
    { value: 'Material', label: 'Материал' }
  ];

  // Column options for report
  const columnOptions = [
    { value: 'date', label: 'Дата' },
    { value: 'resourceType', label: 'Тип ресурса' },
    { value: 'resource', label: 'Ресурс' },
    { value: 'category', label: 'Категория' },
    { value: 'amount', label: 'Сумма' },
    { value: 'description', label: 'Описание' },
    { value: 'paymentMethod', label: 'Способ оплаты' },
    { value: 'invoiceNumber', label: 'Номер счета' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  return (
    <div className="expense-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/expenses">
          Расходы
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <Card className="expense-docx-card">
        <div className="expense-docx-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/expenses')}
            className="back-button"
          >
            Назад к списку расходов
          </Button>
          <Title level={2} className="expense-docx-title">
            Формирование отчёта по расходам
          </Title>
        </div>
        
        <Spin spinning={initialLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card title="Параметры отчёта" className="form-section-card">
                  <Form.Item
                    label="Период отчёта"
                    required
                  >
                    <DateRangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="resourceTypes"
                    label="Типы ресурсов (оставьте пустым для выбора всех)"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Выберите типы ресурсов"
                      allowClear
                      style={{ width: '100%' }}
                      value={filterValues.resourceTypes}
                      onChange={(values) => handleFilterChange('resourceTypes', values)}
                    >
                      {resourceTypeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="categories"
                    label="Категории расходов (оставьте пустым для выбора всех)"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Выберите категории"
                      allowClear
                      style={{ width: '100%' }}
                      value={filterValues.categories}
                      onChange={(values) => handleFilterChange('categories', values)}
                    >
                      {categories.map(category => (
                        <Option key={category} value={category}>
                          {category}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card title="Содержание отчёта" className="form-section-card">
                  <div className="checkbox-group-wrapper">
                    <Form.Item>
                      <Checkbox
                        checked={includeSummary}
                        onChange={(e) => setIncludeSummary(e.target.checked)}
                      >
                        Включить сводную информацию
                      </Checkbox>
                    </Form.Item>
                    
                    <Form.Item>
                      <Checkbox
                        checked={includeDetails}
                        onChange={(e) => setIncludeDetails(e.target.checked)}
                      >
                        Включить детализацию расходов
                      </Checkbox>
                    </Form.Item>
                  </div>
                  
                  {includeDetails && (
                    <Form.Item
                      label="Столбцы для детализации"
                    >
                      <Checkbox.Group
                        options={columnOptions}
                        value={selectedColumns}
                        onChange={handleColumnChange}
                      />
                    </Form.Item>
                  )}
                </Card>
              </Col>
            </Row>
            
            <div className="preview-section">
              <Card title="Предварительный просмотр" className="preview-card">
                <div style={{ marginBottom: '16px' }}>
                  <Text>Записей найдено: {filteredExpenses.length}</Text>
                </div>
                
                <Table
                  dataSource={filteredExpenses.slice(0, 5)}
                  columns={[
                    {
                      title: 'Дата',
                      key: 'date',
                      render: record => moment(record.Date).format('DD.MM.YYYY'),
                      className: !selectedColumns.includes('date') ? 'column-disabled' : ''
                    },
                    {
                      title: 'Тип ресурса',
                      key: 'resourceType',
                      render: record => getResourceTypeDisplayName(record.Resource_Type),
                      className: !selectedColumns.includes('resourceType') ? 'column-disabled' : ''
                    },
                    {
                      title: 'Ресурс',
                      key: 'resource',
                      render: record => getResourceName(record.Resource_Type, record.Resource_ID),
                      className: !selectedColumns.includes('resource') ? 'column-disabled' : ''
                    },
                    {
                      title: 'Категория',
                      dataIndex: 'Category',
                      key: 'category',
                      className: !selectedColumns.includes('category') ? 'column-disabled' : ''
                    },
                    {
                      title: 'Сумма',
                      key: 'amount',
                      render: record => formatCurrency(record.Amount),
                      className: !selectedColumns.includes('amount') ? 'column-disabled' : ''
                    }
                  ]}
                  rowKey="Expense_ID"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: 'Нет данных для отображения' }}
                />
                
                {filteredExpenses.length > 5 && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Text type="secondary">Показаны первые 5 записей из {filteredExpenses.length}</Text>
                  </div>
                )}
              </Card>
            </div>
            
            <Form.Item className="form-actions">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<FileWordOutlined />}
                  size="large"
                  disabled={filteredExpenses.length === 0 || (!includeSummary && !includeDetails)}
                >
                  Скачать .docx
                </Button>
                <Button 
                  icon={<PrinterOutlined />}
                  size="large"
                  onClick={handlePrintPreview}
                  disabled={filteredExpenses.length === 0 || (!includeSummary && !includeDetails)}
                >
                  Предпросмотр для печати
                </Button>
                <Button 
                  onClick={() => navigate('/expenses')}
                  size="large"
                >
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default ExpenseDocx;