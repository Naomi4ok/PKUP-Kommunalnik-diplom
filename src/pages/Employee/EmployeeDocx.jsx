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
import '../../styles/Employee/EmployeeDocx.css';

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

const EmployeeDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'fullName', 'position', 'department', 'contactDetails', 'workSchedule', 'status'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    departments: [],
    positions: [],
    statuses: [],
    workSchedules: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    fetchEmployees().then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered employees when employees change or filters change
  useEffect(() => {
    applyFilters();
  }, [employees, filterValues]);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразование английских статусов и графиков работы в русские
      const translatedData = data.map(employee => ({
        ...employee,
        Status: translateStatusToRussian(employee.Status),
        Work_Schedule: translateWorkScheduleToRussian(employee.Work_Schedule)
      }));
      
      setEmployees(translatedData);
      return translatedData;
    } catch (err) {
      message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Перевод английских статусов на русский
  const translateStatusToRussian = (status) => {
    if (!status) return 'Активен';
    
    switch(status) {
      case 'Active': 
        return 'Активен';
      case 'On Leave': 
        return 'В отпуске';
      case 'Terminated': 
        return 'Уволен';
      default:
        return status;
    }
  };

  // Перевод английских графиков работы на русский
  const translateWorkScheduleToRussian = (schedule) => {
    if (!schedule) return '';
    
    switch(schedule) {
      case 'Flexible': 
        return 'Гибкий';
      case 'Shift Work': 
        return 'Сменный';
      default:
        return schedule;
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Apply filters to employees
  const applyFilters = () => {
    let filtered = [...employees];
    
    // Apply department filter
    if (filterValues.departments.length > 0) {
      filtered = filtered.filter(employee =>
        filterValues.departments.includes(employee.Department)
      );
    }
    
    // Apply position filter
    if (filterValues.positions.length > 0) {
      filtered = filtered.filter(employee =>
        filterValues.positions.includes(employee.Position)
      );
    }
    
    // Apply status filter
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(employee =>
        filterValues.statuses.includes(employee.Status)
      );
    }
    
    // Apply work schedule filter
    if (filterValues.workSchedules.length > 0) {
      filtered = filtered.filter(employee =>
        filterValues.workSchedules.includes(employee.Work_Schedule)
      );
    }
    
    setFilteredEmployees(filtered);
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return Array.from(new Set(employees.map(emp => emp[field]).filter(Boolean)));
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate summaries
      const totalEmployees = filteredEmployees.length;
      
      // Group by department
      const departmentSummary = {};
      filteredEmployees.forEach(employee => {
        const department = employee.Department || 'Без отдела';
        if (!departmentSummary[department]) {
          departmentSummary[department] = 0;
        }
        departmentSummary[department] += 1;
      });

      // Group by position
      const positionSummary = {};
      filteredEmployees.forEach(employee => {
        const position = employee.Position || 'Без должности';
        if (!positionSummary[position]) {
          positionSummary[position] = 0;
        }
        positionSummary[position] += 1;
      });

      // Group by status
      const statusSummary = {};
      filteredEmployees.forEach(employee => {
        const status = employee.Status || 'Активен';
        if (!statusSummary[status]) {
          statusSummary[status] = 0;
        }
        statusSummary[status] += 1;
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
          text: "Отчёт по сотрудникам",
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
            text: `Общее количество сотрудников: ${totalEmployees}`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 100,
              after: 100,
            },
            style: "normalText",
          }),
          
          // Department summary
          new Paragraph({
            text: "Распределение по отделам:",
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
                      text: "Отдел",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 70,
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
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(departmentSummary).map(([department, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: department,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
                        alignment: AlignmentType.CENTER,
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
          
          // Position summary
          new Paragraph({
            text: "Распределение по должностям:",
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
                      text: "Должность",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 70,
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
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(positionSummary).map(([position, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: position,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
                        alignment: AlignmentType.CENTER,
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

          // Status summary
          new Paragraph({
            text: "Распределение по статусам:",
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
                      text: "Статус",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 70,
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
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(statusSummary).map(([status, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: status,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
                        alignment: AlignmentType.CENTER,
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
            text: "Детализация по сотрудникам",
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
                  ...(selectedColumns.includes('fullName') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "ФИО",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('position') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Должность",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('department') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Отдел",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('contactDetails') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Контактные данные",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('workSchedule') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "График работы",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('status') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Статус",
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
              ...filteredEmployees.map(employee => 
                new TableRow({
                  children: [
                    ...(selectedColumns.includes('fullName') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Full_Name || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('position') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Position || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('department') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Department || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('contactDetails') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Contact_Details || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('workSchedule') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Work_Schedule || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('status') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: employee.Status || '',
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
        saveAs(blob, `Отчёт_по_сотрудникам_${moment().format('YYYY-MM-DD')}.docx`);
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
    { value: 'fullName', label: 'ФИО' },
    { value: 'position', label: 'Должность' },
    { value: 'department', label: 'Отдел' },
    { value: 'contactDetails', label: 'Контактные данные' },
    { value: 'workSchedule', label: 'График работы' },
    { value: 'status', label: 'Статус' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  return (
    <div className="employee-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/employees">
          Сотрудники
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/employees')}
          className="back-button"
        >
          Назад к списку сотрудников
        </Button>
        <Title level={3} className="employee-docx-title">
          Формирование отчёта по сотрудникам
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredEmployees.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="employee-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="employee-docx-tabs"
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
                className="employee-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Фильтры" 
                      className="docx-filter-card"
                      bordered={false}
                    >
                      <div className="additional-filters">
                        <Form.Item
                          name="departments"
                          label="Отделы"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все отделы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.departments}
                            onChange={(values) => handleFilterChange('departments', values)}
                          >
                            {getUniqueValues('Department').map(department => (
                              <Option key={department} value={department}>
                                {department}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="positions"
                          label="Должности"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все должности"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.positions}
                            onChange={(values) => handleFilterChange('positions', values)}
                          >
                            {getUniqueValues('Position').map(position => (
                              <Option key={position} value={position}>
                                {position}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="statuses"
                          label="Статусы"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все статусы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.statuses}
                            onChange={(values) => handleFilterChange('statuses', values)}
                          >
                            {['Активен', 'В отпуске', 'Уволен'].map(status => (
                              <Option key={status} value={status}>
                                {status}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="workSchedules"
                          label="График работы"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все графики"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.workSchedules}
                            onChange={(values) => handleFilterChange('workSchedules', values)}
                          >
                            {getUniqueValues('Work_Schedule').map(schedule => (
                              <Option key={schedule} value={schedule}>
                                {schedule}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
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
                            <b>Включить детализацию по сотрудникам</b>
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
                <Card className="employee-summary-card" bordered={false}>
                  <div className="employee-summary">
                    <div className="employee-count">
                      <Text>Найдено сотрудников: <b>{filteredEmployees.length}</b></Text>
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
                {filteredEmployees.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общее количество сотрудников: <b>{filteredEmployees.length}</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Card title="По отделам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredEmployees.reduce((acc, employee) => {
                                  const department = employee.Department || 'Без отдела';
                                  acc[department] = (acc[department] || 0) + 1;
                                  return acc;
                                }, {})).map(([department, count]) => ({ department, count }))}
                                columns={[
                                  { title: 'Отдел', dataIndex: 'department', key: 'department' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'count',
                                    key: 'count'
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По должностям" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredEmployees.reduce((acc, employee) => {
                                  const position = employee.Position || 'Без должности';
                                  acc[position] = (acc[position] || 0) + 1;
                                  return acc;
                                }, {})).map(([position, count]) => ({ position, count }))}
                                columns={[
                                  { title: 'Должность', dataIndex: 'position', key: 'position' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'count',
                                    key: 'count'
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По статусам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredEmployees.reduce((acc, employee) => {
                                  const status = employee.Status || 'Активен';
                                  acc[status] = (acc[status] || 0) + 1;
                                  return acc;
                                }, {})).map(([status, count]) => ({ status, count }))}
                                columns={[
                                  { title: 'Статус', dataIndex: 'status', key: 'status' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'count',
                                    key: 'count'
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
                        title="Детализация по сотрудникам" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredEmployees}
                          columns={[
                            ...(selectedColumns.includes('fullName') ? [{
                              title: 'ФИО',
                              dataIndex: 'Full_Name',
                              key: 'fullName'
                            }] : []),
                            ...(selectedColumns.includes('position') ? [{
                              title: 'Должность',
                              dataIndex: 'Position',
                              key: 'position'
                            }] : []),
                            ...(selectedColumns.includes('department') ? [{
                              title: 'Отдел',
                              dataIndex: 'Department',
                              key: 'department'
                            }] : []),
                            ...(selectedColumns.includes('contactDetails') ? [{
                              title: 'Контактные данные',
                              dataIndex: 'Contact_Details',
                              key: 'contactDetails'
                            }] : []),
                            ...(selectedColumns.includes('workSchedule') ? [{
                              title: 'График работы',
                              dataIndex: 'Work_Schedule',
                              key: 'workSchedule'
                            }] : []),
                            ...(selectedColumns.includes('status') ? [{
                              title: 'Статус',
                              dataIndex: 'Status',
                              key: 'status'
                            }] : [])
                          ]}
                          rowKey="Employee_ID"
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

export default EmployeeDocx;