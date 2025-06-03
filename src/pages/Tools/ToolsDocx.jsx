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
  Tabs,
  Row,
  Col,
  Spin,
  Table,
  Checkbox,
  Collapse
} from 'antd';
import {
  HomeOutlined,
  FileWordOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  FileTextOutlined,
  TableOutlined,
  FilterOutlined
} from '@ant-design/icons';
import moment from 'moment';
import '../../styles/Tools/ToolsDocx.css';

// Импортируем библиотеку для создания docx документов
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table as DocxTable, 
  TableRow, 
  TableCell, 
  TextRun, 
  HeadingLevel, 
  BorderStyle, 
  AlignmentType, 
  Header, 
  Footer, 
  PageNumber, 
  WidthType, 
  TableLayoutType 
} from 'docx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ToolsDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'name', 'category', 'quantity', 'location', 'responsible'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    categories: [],
    locations: [],
    responsibleEmployees: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchTools(),
      fetchEmployees()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered tools when tools change or filters change
  useEffect(() => {
    applyFilters();
  }, [tools, filterValues]);

  // Extract unique categories and locations when tools data changes
  useEffect(() => {
    if (tools.length > 0) {
      const uniqueCategories = Array.from(
        new Set(tools.map(t => t.Category).filter(Boolean))
      );
      setCategories(uniqueCategories);
      
      const uniqueLocations = Array.from(
        new Set(tools.map(t => t.Location).filter(Boolean))
      );
      setLocations(uniqueLocations);
    }
  }, [tools]);

  // Fetch tools
  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTools(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные об инструментах: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
      return [];
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.Employee_ID === employeeId);
    return employee ? employee.Full_Name : 'Не назначен';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Проверка на валидность даты
      if (isNaN(date.getTime())) return '';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      return '';
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Apply filters to tools
  const applyFilters = () => {
    let filtered = [...tools];
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(tool =>
        filterValues.categories.includes(tool.Category)
      );
    }
    
    // Apply location filter
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(tool =>
        filterValues.locations.includes(tool.Location)
      );
    }
    
    // Apply responsible employee filter
    if (filterValues.responsibleEmployees.length > 0) {
      filtered = filtered.filter(tool =>
        filterValues.responsibleEmployees.includes(tool.Responsible_Employee_ID)
      );
    }
    
    setFilteredTools(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate totals and summaries
      const totalTools = filteredTools.reduce((sum, tool) => sum + (tool.Quantity || 0), 0);
      
      // Group by category
      const categorySummary = {};
      filteredTools.forEach(tool => {
        const category = tool.Category || 'Без категории';
        if (!categorySummary[category]) {
          categorySummary[category] = 0;
        }
        categorySummary[category] += tool.Quantity || 0;
      });

      // Group by location
      const locationSummary = {};
      filteredTools.forEach(tool => {
        const location = tool.Location || 'Не указано';
        if (!locationSummary[location]) {
          locationSummary[location] = 0;
        }
        locationSummary[location] += tool.Quantity || 0;
      });

      // Group by responsible employee
      const responsibleSummary = {};
      filteredTools.forEach(tool => {
        const responsibleName = getEmployeeName(tool.Responsible_Employee_ID);
        if (!responsibleSummary[responsibleName]) {
          responsibleSummary[responsibleName] = 0;
        }
        responsibleSummary[responsibleName] += tool.Quantity || 0;
      });

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1000,
                  right: 1000,
                  bottom: 1000,
                  left: 1000,
                },
              },
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        children: [PageNumber.CURRENT],
                      }),
                    ],
                    style: "footerStyle",
                  }),
                ],
              }),
            },
            children: [
              new Paragraph({
                text: "Отчёт по инструментам",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  before: 200,
                  after: 200,
                },
                style: "headingStyle",
              }),
              new Paragraph({
                text: `Дата формирования: ${moment().format('DD.MM.YYYY')}`,
                alignment: AlignmentType.CENTER,
                spacing: {
                  before: 100,
                  after: 400,
                },
                style: "normalText",
              }),
              
              // Summary section
              ...(includeSummary ? [
                new Paragraph({
                  text: "Сводная информация",
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.LEFT,
                  spacing: {
                    before: 200,
                    after: 200,
                  },
                  style: "headingStyle",
                }),
                new Paragraph({
                  text: `Общее количество инструментов: ${totalTools} шт.`,
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 100,
                    after: 100,
                  },
                  style: "normalText",
                }),
                new Paragraph({
                  text: `Всего наименований: ${filteredTools.length} шт.`,
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 100,
                    after: 100,
                  },
                  style: "normalText",
                }),
                
                // Category summary
                new Paragraph({
                  text: "Распределение по категориям:",
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 200,
                    after: 100,
                  },
                  style: "normalText",
                }),
                new DocxTable({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        new TableCell({
                          children: [new Paragraph({
                            text: "Категория",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            fill: "F2F2F2",
                          },
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            text: "Количество",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            fill: "F2F2F2",
                          },
                        })
                      ]
                    }),
                    ...Object.entries(categorySummary).map(([category, quantity]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({
                              text: category,
                              alignment: AlignmentType.LEFT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: `${quantity} шт.`,
                              alignment: AlignmentType.RIGHT,
                              style: "normalText",
                            })]
                          })
                        ]
                      })
                    )
                  ],
                  tableProperties: {
                    tableWidth: {
                      size: 100,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideHorizontal: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideVertical: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                    },
                    layout: TableLayoutType.FIXED,
                  },
                }),
                
                // Location summary
                new Paragraph({
                  text: "Распределение по местам хранения:",
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 200,
                    after: 100,
                  },
                  style: "normalText",
                }),
                new DocxTable({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        new TableCell({
                          children: [new Paragraph({
                            text: "Место хранения",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            fill: "F2F2F2",
                          },
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            text: "Количество",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 50,
                            type: WidthType.PERCENTAGE,
                          },
                          shading: {
                            fill: "F2F2F2",
                          },
                        })
                      ]
                    }),
                    ...Object.entries(locationSummary).map(([location, quantity]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({
                              text: location,
                              alignment: AlignmentType.LEFT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: `${quantity} шт.`,
                              alignment: AlignmentType.RIGHT,
                              style: "normalText",
                            })]
                          })
                        ]
                      })
                    )
                  ],
                  tableProperties: {
                    tableWidth: {
                      size: 100,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideHorizontal: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideVertical: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                    },
                    layout: TableLayoutType.FIXED,
                  },
                })
              ] : []),
              
              // Details section
              ...(includeDetails ? [
                new Paragraph({
                  text: "Детализация по инструментам",
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.LEFT,
                  spacing: {
                    before: 400,
                    after: 200,
                  },
                  style: "headingStyle",
                }),
                new DocxTable({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        ...(selectedColumns.includes('name') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Наименование",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('category') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Категория",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('quantity') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Количество",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('location') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Место хранения",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('responsible') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Ответственный",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('lastCheck') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Дата последней проверки",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : [])
                      ]
                    }),
                    ...filteredTools.map(tool => 
                      new TableRow({
                        children: [
                          ...(selectedColumns.includes('name') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: tool.Name || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('category') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: tool.Category || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('quantity') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: `${tool.Quantity || 0} шт.`,
                                alignment: AlignmentType.RIGHT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('location') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: tool.Location || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('responsible') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: getEmployeeName(tool.Responsible_Employee_ID),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('lastCheck') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: formatDate(tool.Last_Check_Date),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : [])
                        ]
                      })
                    )
                  ],
                  tableProperties: {
                    tableWidth: {
                      size: 100,
                      type: WidthType.PERCENTAGE,
                    },
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideHorizontal: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                      insideVertical: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "000000",
                      },
                    },
                    layout: TableLayoutType.FIXED,
                  },
                })
              ] : []),
              
              // Footer
              new Paragraph({
                text: `Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}`,
                alignment: AlignmentType.RIGHT,
                spacing: {
                  before: 400,
                  after: 0,
                },
                style: "normalText",
              })
            ]
          }
        ],
        styles: {
          paragraphStyles: [
            {
              id: "normalText",
              name: "Normal Text",
              run: {
                size: 24, // 12pt
                font: "Times New Roman",
              },
              paragraph: {
                spacing: {
                  line: 276, // 1.15 line spacing
                },
              },
            },
            {
              id: "headingStyle",
              name: "Heading Style",
              run: {
                size: 28, // 14pt
                font: "Times New Roman",
                bold: true,
              },
              paragraph: {
                spacing: {
                  line: 276, // 1.15 line spacing
                },
              },
            },
            {
              id: "tableHeader",
              name: "Table Header",
              run: {
                size: 24, // 12pt
                font: "Times New Roman",
                bold: true,
              },
            },
            {
              id: "headerStyle",
              name: "Header Style",
              run: {
                size: 20, // 10pt
                font: "Times New Roman",
                color: "808080",
              },
            },
            {
              id: "footerStyle",
              name: "Footer Style",
              run: {
                size: 18, // 9pt
                font: "Times New Roman",
                color: "808080",
              },
            },
          ],
        },
      });

      // Generate and save document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Отчёт_по_инструментам_${moment().format('YYYY-MM-DD')}.docx`);
        message.success('Отчёт успешно сформирован!');
      });
    } catch (err) {
      message.error(`Ошибка при формировании отчёта: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    handleDownloadDocx();
  };

  // Column options for report
  const columnOptions = [
    { value: 'name', label: 'Наименование' },
    { value: 'category', label: 'Категория' },
    { value: 'quantity', label: 'Количество' },
    { value: 'location', label: 'Место хранения' },
    { value: 'responsible', label: 'Ответственный' },
    { value: 'lastCheck', label: 'Дата последней проверки' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  // Total summary data
  const totalTools = filteredTools.reduce((sum, tool) => sum + (tool.Quantity || 0), 0);

  return (
    <div className="tools-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/tools">
          Инструменты
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/tools')}
          className="back-button"
        >
          Назад к списку инструментов
        </Button>
        <Title level={3} className="tools-docx-title">
          Формирование отчёта по инструментам
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredTools.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="tools-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="tools-docx-tabs"
          >
            <TabPane 
              tab={
                <span>
                  Параметры отчёта
                </span>
              } 
              key="1"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
                className="tools-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Фильтры" 
                      className="docx-filter-card"
                      bordered={false}
                    >
                      <Form.Item
                        name="categories"
                        label="Категории"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Все категории"
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
                      
                      <Form.Item
                        name="locations"
                        label="Места хранения"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Все места хранения"
                          allowClear
                          style={{ width: '100%' }}
                          value={filterValues.locations}
                          onChange={(values) => handleFilterChange('locations', values)}
                        >
                          {locations.map(location => (
                            <Option key={location} value={location}>
                              {location}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name="responsibleEmployees"
                        label="Ответственные сотрудники"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Все сотрудники"
                          allowClear
                          style={{ width: '100%' }}
                          value={filterValues.responsibleEmployees}
                          onChange={(values) => handleFilterChange('responsibleEmployees', values)}
                        >
                          {employees.map(employee => (
                            <Option key={employee.Employee_ID} value={employee.Employee_ID}>
                              {employee.Full_Name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Card>
                  </Col>
                  
                  {/* Правая колонка с настройками содержания */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Содержание отчёта" 
                      className="docx-content-card"
                      bordered={false}
                    >
                      <div className="content-options">
                        <Form.Item>
                          <Checkbox
                            checked={includeSummary}
                            onChange={(e) => setIncludeSummary(e.target.checked)}
                          >
                            <b>Включить сводную информацию</b>
                          </Checkbox>
                        </Form.Item>
                        
                        <Form.Item>
                          <Checkbox
                            checked={includeDetails}
                            onChange={(e) => setIncludeDetails(e.target.checked)}
                          >
                            <b>Включить детализацию инструментов</b>
                          </Checkbox>
                        </Form.Item>
                      </div>
                      
                      {includeDetails && (
                        <Collapse 
                          ghost 
                          defaultActiveKey={['1']} 
                          className="columns-collapse"
                        >
                          <Panel header="Выбор столбцов" key="1">
                            <Form.Item>
                              <Checkbox.Group
                                options={columnOptions}
                                value={selectedColumns}
                                onChange={handleColumnChange}
                                className="column-checkbox-group"
                              />
                            </Form.Item>
                          </Panel>
                        </Collapse>
                      )}
                    </Card>
                  </Col>
                </Row>
                
                {/* Информация о найденных данных */}
                <Card className="tools-summary-card" bordered={false}>
                  <div className="tools-summary">
                    <div className="tools-count">
                      <Text>Найдено наименований: <b>{filteredTools.length}</b></Text>
                    </div>
                    <div className="tools-total">
                      <Text>Общее количество: <b>{totalTools} шт.</b></Text>
                    </div>
                  </div>
                </Card>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  Предпросмотр
                </span>
              } 
              key="2"
            >
              <div className="preview-container">
                {filteredTools.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общее количество инструментов: <b>{totalTools} шт.</b></p>
                        <p className="summary-items">Всего наименований: <b>{filteredTools.length} шт.</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Card title="По категориям" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTools.reduce((acc, tool) => {
                                  const category = tool.Category || 'Без категории';
                                  acc[category] = (acc[category] || 0) + (tool.Quantity || 0);
                                  return acc;
                                }, {})).map(([category, quantity]) => ({ category, quantity }))}
                                columns={[
                                  { title: 'Категория', dataIndex: 'category', key: 'category' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    render: quantity => `${quantity} шт.`
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По местам хранения" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTools.reduce((acc, tool) => {
                                  const location = tool.Location || 'Не указано';
                                  acc[location] = (acc[location] || 0) + (tool.Quantity || 0);
                                  return acc;
                                }, {})).map(([location, quantity]) => ({ location, quantity }))}
                                columns={[
                                  { title: 'Место хранения', dataIndex: 'location', key: 'location' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    render: quantity => `${quantity} шт.`
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По ответственным" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTools.reduce((acc, tool) => {
                                  const responsible = getEmployeeName(tool.Responsible_Employee_ID);
                                  acc[responsible] = (acc[responsible] || 0) + (tool.Quantity || 0);
                                  return acc;
                                }, {})).map(([responsible, quantity]) => ({ responsible, quantity }))}
                                columns={[
                                  { title: 'Ответственный', dataIndex: 'responsible', key: 'responsible' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    render: quantity => `${quantity} шт.`
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    )}
                    
                    {includeDetails && (
                      <Card 
                        title="Детализация инструментов" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredTools}
                          columns={[
                            ...(selectedColumns.includes('name') ? [{
                              title: 'Наименование',
                              dataIndex: 'Name',
                              key: 'name'
                            }] : []),
                            ...(selectedColumns.includes('category') ? [{
                              title: 'Категория',
                              dataIndex: 'Category',
                              key: 'category'
                            }] : []),
                            ...(selectedColumns.includes('quantity') ? [{
                              title: 'Количество',
                              dataIndex: 'Quantity',
                              key: 'quantity',
                              render: quantity => `${quantity || 0} шт.`
                            }] : []),
                            ...(selectedColumns.includes('location') ? [{
                              title: 'Место хранения',
                              dataIndex: 'Location',
                              key: 'location'
                            }] : []),
                            ...(selectedColumns.includes('responsible') ? [{
                              title: 'Ответственный',
                              key: 'responsible',
                              render: record => getEmployeeName(record.Responsible_Employee_ID)
                            }] : []),
                            ...(selectedColumns.includes('lastCheck') ? [{
                              title: 'Дата последней проверки',
                              key: 'lastCheck',
                              render: record => formatDate(record.Last_Check_Date)
                            }] : [])
                          ]}
                          rowKey="Tool_ID"
                          pagination={{ pageSize: 10 }}
                          size="small"
                          locale={{ emptyText: 'Нет данных для отображения' }}
                          scroll={{ x: 'max-content' }}
                        />
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="no-data-message">
                    <Text>Нет данных для отображения. Пожалуйста, измените параметры фильтрации.</Text>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </Spin>
    </div>
  );
};

export default ToolsDocx;