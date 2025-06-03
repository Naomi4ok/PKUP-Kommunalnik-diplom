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
  Row,
  Col,
  Spin,
  Table,
  Checkbox,
  Collapse,
  Tabs
} from 'antd';
import {
  HomeOutlined,
  FileWordOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';

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
import '../../styles/Schedule/ScheduleDocx.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ScheduleDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [resourceOptions, setResourceOptions] = useState({
    employees: [],
    equipment: [],
    transportation: []
  });
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment().endOf('month')]);
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'title', 'time', 'status', 'location', 'process'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    statuses: [],
    priorities: [],
    processes: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Статусы задач
  const statusOptions = [
    { value: 'scheduled', label: 'Запланировано', color: 'blue' },
    { value: 'in-progress', label: 'В процессе', color: 'orange' },
    { value: 'completed', label: 'Выполнено', color: 'green' },
    { value: 'delayed', label: 'Отложено', color: 'red' },
    { value: 'cancelled', label: 'Отменено', color: 'default' }
  ];

  // Приоритеты задач
  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: 'green' },
    { value: 'medium', label: 'Средний', color: 'blue' },
    { value: 'high', label: 'Высокий', color: 'orange' },
    { value: 'critical', label: 'Критичный', color: 'red' }
  ];

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProcesses(),
      fetchResourceOptions()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered tasks when tasks change or filters change
  useEffect(() => {
    applyFilters();
  }, [tasks, dateRange, filterValues]);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о задачах: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch processes
  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/processes');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setProcesses(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о процессах: ${err.message}`);
      return [];
    }
  };

  // Fetch all resource options
  const fetchResourceOptions = async () => {
    try {
      const [employees, equipment, transportation] = await Promise.all([
        fetch('/api/employees').then(res => res.json()),
        fetch('/api/equipment').then(res => res.json()),
        fetch('/api/transportation').then(res => res.json())
      ]);
      
      setResourceOptions({
        employees,
        equipment,
        transportation
      });
      return { employees, equipment, transportation };
    } catch (err) {
      message.error(`Не удалось загрузить данные о ресурсах: ${err.message}`);
      return null;
    }
  };

  // Get process name by id
  const getProcessName = (processId) => {
    if (!processId) return '-';
    const process = processes.find(p => p.Process_ID === processId);
    return process ? process.Name : `ID: ${processId}`;
  };

  // Get employee names by ids
  const getEmployeeNames = (employeeIds) => {
    if (!employeeIds || employeeIds.length === 0) return '-';
    const names = employeeIds.map(id => {
      const employee = resourceOptions.employees.find(e => e.Employee_ID === id);
      return employee ? employee.Full_Name : `ID: ${id}`;
    });
    return names.join(', ');
  };

  // Get equipment names by ids
  const getEquipmentNames = (equipmentIds) => {
    if (!equipmentIds || equipmentIds.length === 0) return '-';
    const names = equipmentIds.map(id => {
      const equipment = resourceOptions.equipment.find(e => e.Equipment_ID === id);
      return equipment ? equipment.Name : `ID: ${id}`;
    });
    return names.join(', ');
  };

  // Get transport names by ids
  const getTransportNames = (transportIds) => {
    if (!transportIds || transportIds.length === 0) return '-';
    const names = transportIds.map(id => {
      const transport = resourceOptions.transportation.find(t => t.Transport_ID === id);
      return transport ? `${transport.Brand} ${transport.Model}` : `ID: ${id}`;
    });
    return names.join(', ');
  };

  // Get status display name
  const getStatusDisplayName = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Get priority display name
  const getPriorityDisplayName = (priority) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption ? priorityOption.label : priority;
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

  // Apply filters to tasks
  const applyFilters = () => {
    let filtered = [...tasks];
    
    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(task => {
        const taskDate = moment(task.Date);
        return taskDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply status filter
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(task =>
        filterValues.statuses.includes(task.Status)
      );
    }
    
    // Apply priority filter
    if (filterValues.priorities.length > 0) {
      filtered = filtered.filter(task =>
        filterValues.priorities.includes(task.Priority)
      );
    }
    
    // Apply process filter
    if (filterValues.processes.length > 0) {
      filtered = filtered.filter(task =>
        filterValues.processes.includes(task.ProcessId)
      );
    }
    
    setFilteredTasks(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate summaries
      const totalTasks = filteredTasks.length;
      
      // Group by status
      const statusSummary = {};
      filteredTasks.forEach(task => {
        const statusName = getStatusDisplayName(task.Status);
        if (!statusSummary[statusName]) {
          statusSummary[statusName] = 0;
        }
        statusSummary[statusName]++;
      });

      // Group by priority
      const prioritySummary = {};
      filteredTasks.forEach(task => {
        const priorityName = getPriorityDisplayName(task.Priority);
        if (!prioritySummary[priorityName]) {
          prioritySummary[priorityName] = 0;
        }
        prioritySummary[priorityName]++;
      });

      // Group by process
      const processSummary = {};
      filteredTasks.forEach(task => {
        const processName = getProcessName(task.ProcessId);
        if (!processSummary[processName]) {
          processSummary[processName] = 0;
        }
        processSummary[processName]++;
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
                text: "Отчёт по расписанию задач",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: {
                  before: 200,
                  after: 200,
                },
                style: "headingStyle",
              }),
              new Paragraph({
                text: `За период: ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}`,
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
                  text: `Общее количество задач: ${totalTasks}`,
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 100,
                    after: 100,
                  },
                  style: "normalText",
                }),
                
                // Status summary
                new Paragraph({
                  text: "Задачи по статусам:",
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
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    layout: TableLayoutType.FIXED,
                  },
                }),
                
                // Priority summary
                new Paragraph({
                  text: "Задачи по приоритетам:",
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
                            text: "Приоритет",
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
                    ...Object.entries(prioritySummary).map(([priority, count]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({
                              text: priority,
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
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    layout: TableLayoutType.FIXED,
                  },
                })
              ] : []),
              
              // Details section
              ...(includeDetails ? [
                new Paragraph({
                  text: "Детализация задач",
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
                        ...(selectedColumns.includes('date') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Дата",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('title') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Название задачи",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('time') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Время",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('status') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Статус",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('priority') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Приоритет",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('location') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Местоположение",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('process') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Процесс",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('employees') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Сотрудники",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : []),
                        ...(selectedColumns.includes('progress') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Прогресс",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: { fill: "F2F2F2" },
                          })
                        ] : [])
                      ]
                    }),
                    ...filteredTasks.map(task => 
                      new TableRow({
                        children: [
                          ...(selectedColumns.includes('date') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: moment(task.Date).format('DD.MM.YYYY'),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('title') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: task.Title || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('time') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: `${task.StartTime || ''} - ${task.EndTime || ''}`,
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('status') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: getStatusDisplayName(task.Status),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('priority') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: getPriorityDisplayName(task.Priority),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('location') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: task.Location || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('process') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: getProcessName(task.ProcessId),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('employees') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: getEmployeeNames(JSON.parse(task.EmployeeIds || '[]')),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('progress') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: `${task.Progress || 0}%`,
                                alignment: AlignmentType.CENTER,
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
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
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
        saveAs(blob, `Отчёт_по_расписанию_задач_${moment().format('YYYY-MM-DD')}.docx`);
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
    { value: 'date', label: 'Дата' },
    { value: 'title', label: 'Название задачи' },
    { value: 'time', label: 'Время' },
    { value: 'status', label: 'Статус' },
    { value: 'priority', label: 'Приоритет' },
    { value: 'location', label: 'Местоположение' },
    { value: 'process', label: 'Процесс' },
    { value: 'employees', label: 'Сотрудники' },
    { value: 'progress', label: 'Прогресс' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  // Total summary data
  const totalTasks = filteredTasks.length;

  return (
    <div className="schedule-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/schedule">
          Расписание задач
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/schedule')}
          className="back-button"
        >
          Назад к расписанию
        </Button>
        <Title level={3} className="schedule-docx-title">
          Формирование отчёта по расписанию задач
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredTasks.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="schedule-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="schedule-docx-tabs"
          >
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Параметры отчёта
                </span>
              } 
              key="1"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
                className="schedule-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Период и фильтры" 
                      className="docx-filter-card"
                      bordered={false}
                    >
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
                      
                      <div className="additional-filters">
                        <Form.Item
                          name="statuses"
                          label="Статусы задач"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все статусы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.statuses}
                            onChange={(values) => handleFilterChange('statuses', values)}
                          >
                            {statusOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="priorities"
                          label="Приоритеты"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все приоритеты"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.priorities}
                            onChange={(values) => handleFilterChange('priorities', values)}
                          >
                            {priorityOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="processes"
                          label="Процессы"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все процессы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.processes}
                            onChange={(values) => handleFilterChange('processes', values)}
                          >
                            {processes.map(process => (
                              <Option key={process.Process_ID} value={process.Process_ID}>
                                {process.Name}
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
                            <b>Включить детализацию задач</b>
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
                <Card className="schedule-summary-card" bordered={false}>
                  <div className="schedule-summary">
                    <div className="schedule-count">
                      <Text>Найдено задач: <b>{totalTasks}</b></Text>
                    </div>
                    <div className="schedule-completed">
                      <Text>Выполнено: <b>{filteredTasks.filter(t => t.Status === 'completed').length}</b></Text>
                    </div>
                    <div className="schedule-in-progress">
                      <Text>В процессе: <b>{filteredTasks.filter(t => t.Status === 'in-progress').length}</b></Text>
                    </div>
                  </div>
                </Card>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  Предпросмотр
                </span>
              } 
              key="2"
            >
              <div className="preview-container">
                {filteredTasks.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общее количество задач: <b>{totalTasks}</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Card title="По статусам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTasks.reduce((acc, task) => {
                                  const statusName = getStatusDisplayName(task.Status);
                                  acc[statusName] = (acc[statusName] || 0) + 1;
                                  return acc;
                                }, {})).map(([status, count]) => ({ status, count }))}
                                columns={[
                                  { title: 'Статус', dataIndex: 'status', key: 'status' },
                                  { title: 'Количество', dataIndex: 'count', key: 'count' }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По приоритетам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTasks.reduce((acc, task) => {
                                  const priorityName = getPriorityDisplayName(task.Priority);
                                  acc[priorityName] = (acc[priorityName] || 0) + 1;
                                  return acc;
                                }, {})).map(([priority, count]) => ({ priority, count }))}
                                columns={[
                                  { title: 'Приоритет', dataIndex: 'priority', key: 'priority' },
                                  { title: 'Количество', dataIndex: 'count', key: 'count' }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card title="По процессам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTasks.reduce((acc, task) => {
                                  const processName = getProcessName(task.ProcessId);
                                  acc[processName] = (acc[processName] || 0) + 1;
                                  return acc;
                                }, {})).map(([process, count]) => ({ process, count }))}
                                columns={[
                                  { title: 'Процесс', dataIndex: 'process', key: 'process' },
                                  { title: 'Количество', dataIndex: 'count', key: 'count' }
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
                        title="Детализация задач" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredTasks}
                          columns={[
                            ...(selectedColumns.includes('date') ? [{
                              title: 'Дата',
                              key: 'date',
                              render: record => moment(record.Date).format('DD.MM.YYYY')
                            }] : []),
                            ...(selectedColumns.includes('title') ? [{
                              title: 'Название задачи',
                              dataIndex: 'Title',
                              key: 'title'
                            }] : []),
                            ...(selectedColumns.includes('time') ? [{
                              title: 'Время',
                              key: 'time',
                              render: record => `${record.StartTime} - ${record.EndTime}`
                            }] : []),
                            ...(selectedColumns.includes('status') ? [{
                              title: 'Статус',
                              key: 'status',
                              render: record => getStatusDisplayName(record.Status)
                            }] : []),
                            ...(selectedColumns.includes('priority') ? [{
                              title: 'Приоритет',
                              key: 'priority',
                              render: record => getPriorityDisplayName(record.Priority)
                            }] : []),
                            ...(selectedColumns.includes('location') ? [{
                              title: 'Местоположение',
                              dataIndex: 'Location',
                              key: 'location'
                            }] : []),
                            ...(selectedColumns.includes('process') ? [{
                              title: 'Процесс',
                              key: 'process',
                              render: record => getProcessName(record.ProcessId)
                            }] : []),
                            ...(selectedColumns.includes('employees') ? [{
                              title: 'Сотрудники',
                              key: 'employees',
                              render: record => getEmployeeNames(JSON.parse(record.EmployeeIds || '[]'))
                            }] : []),
                            ...(selectedColumns.includes('progress') ? [{
                              title: 'Прогресс',
                              key: 'progress',
                              render: record => `${record.Progress || 0}%`
                            }] : [])
                          ]}
                          rowKey="Task_ID"
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

export default ScheduleDocx;