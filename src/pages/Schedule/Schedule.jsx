import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Badge, 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Tabs, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  TimePicker, 
  Select, 
  Slider, 
  message, 
  Tooltip, 
  Breadcrumb,
  Empty,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  HomeOutlined,
  TeamOutlined, 
  ToolOutlined, 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/ru'; // Импортируем русскую локализацию moment
import locale from 'antd/es/date-picker/locale/ru_RU'; // Импортируем русскую локализацию для DatePicker
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Schedule/Schedule.css';

// Устанавливаем русскую локализацию для moment
moment.locale('ru');

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Schedule = () => {
  const navigate = useNavigate();
  
  // State for tasks and related data
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [transport, setTransport] = useState([]);
  const [processes, setProcesses] = useState([]);

  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);

  // Priority and status options
  const priorityOptions = [
    { value: 'low', label: 'Низкий', color: '#52c41a' },
    { value: 'medium', label: 'Средний', color: '#1890ff' },
    { value: 'high', label: 'Высокий', color: '#fa8c16' },
    { value: 'critical', label: 'Критичный', color: '#f5222d' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Запланировано', color: '#1890ff' },
    { value: 'in-progress', label: 'В процессе', color: '#fa8c16' },
    { value: 'completed', label: 'Выполнено', color: '#52c41a' },
    { value: 'delayed', label: 'Отложено', color: '#f5222d' },
    { value: 'cancelled', label: 'Отменено', color: '#595959' }
  ];

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Update selectedDateTasks whenever date or tasks change
  useEffect(() => {
    filterTasksByDate(selectedDate);
  }, [selectedDate, tasks]);

  // Main data fetching function
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTasks(),
        fetchEmployees(),
        fetchEquipment(),
        fetchTransport(),
        fetchProcesses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  // Individual data fetching functions
  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/schedule');
      setTasks(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Не удалось загрузить задачи');
      return [];
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.get('/api/equipment');
      setEquipment(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  };

  const fetchTransport = async () => {
    try {
      const response = await axios.get('/api/transportation');
      setTransport(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching transport:', error);
      return [];
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get('/api/schedule/processes/all');
      setProcesses(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching processes:', error);
      return [];
    }
  };

  // Filter tasks for the selected date
  const filterTasksByDate = (date) => {
    const filtered = tasks.filter(task => task.Date === date);
    setSelectedDateTasks(filtered);
  };

  // Handle date selection in calendar
  const onSelect = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    setSelectedDate(dateString);
  };

  // Get tasks for a specific date (for calendar cell rendering)
  const getListData = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    return tasks.filter(task => task.Date === dateString);
  };

  // Render calendar cell data
  const dateCellRender = (value) => {
    const listData = getListData(value);
    
    return (
      <ul className="tasks-list">
        {listData.map(item => (
          <li key={item.Task_ID} onClick={() => showTaskDetails(item)}>
            <Badge
              color={statusOptions.find(s => s.value === item.Status)?.color || 'blue'}
              text={
                <Tooltip title={item.Title}>
                  <span className="task-badge-text">{item.Title}</span>
                </Tooltip>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  // Add a new task
  const showAddTaskModal = () => {
    setIsEditing(false);
    setCurrentTask(null);
    form.resetFields();
    
    // Set default date and times
    form.setFieldsValue({
      date: moment(selectedDate),
      timeRange: [moment('08:00', 'HH:mm'), moment('17:00', 'HH:mm')],
      status: 'scheduled',
      priority: 'medium',
      progress: 0
    });
    
    setModalVisible(true);
  };

  // Edit existing task
  const showEditTaskModal = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    
    form.setFieldsValue({
      title: task.Title,
      date: moment(task.Date),
      timeRange: [
        moment(task.StartTime, 'HH:mm'),
        moment(task.EndTime, 'HH:mm')
      ],
      employeeIds: task.employeeIds,
      equipmentIds: task.equipmentIds,
      transportIds: task.transportIds,
      processId: task.ProcessId,
      location: task.Location,
      status: task.Status,
      priority: task.Priority,
      description: task.Description,
      progress: task.Progress,
    });
    
    setModalVisible(true);
  };

  // Show task details
  const showTaskDetails = (task) => {
    setCurrentTask(task);
    showEditTaskModal(task);
  };

  // Handle form submission
  const handleSubmit = () => {
    form.validateFields()
      .then(async (values) => {
        setIsLoading(true);
        
        try {
          // Format date and time
          const date = values.date.format('YYYY-MM-DD');
          const startTime = values.timeRange[0].format('HH:mm');
          const endTime = values.timeRange[1].format('HH:mm');
          
          const taskData = {
            title: values.title,
            date,
            startTime,
            endTime,
            employeeIds: values.employeeIds || [],
            equipmentIds: values.equipmentIds || [],
            transportIds: values.transportIds || [],
            processId: values.processId,
            location: values.location,
            status: values.status,
            priority: values.priority,
            description: values.description,
            progress: values.progress || 0,
          };
          
          if (isEditing && currentTask) {
            // Update existing task
            await axios.put(`/api/schedule/${currentTask.Task_ID}`, taskData);
            message.success('Задача обновлена успешно');
          } else {
            // Create new task
            await axios.post('/api/schedule', taskData);
            message.success('Задача добавлена успешно');
          }
          
          // Refresh tasks data
          fetchTasks();
          setModalVisible(false);
        } catch (error) {
          console.error('Error saving task:', error);
          message.error('Произошла ошибка при сохранении задачи');
        } finally {
          setIsLoading(false);
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  // Delete a task
  const handleDeleteTask = (taskId) => {
    Modal.confirm({
      title: 'Вы уверены, что хотите удалить эту задачу?',
      icon: <ExclamationCircleOutlined />,
      content: 'Это действие нельзя будет отменить',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await axios.delete(`/api/schedule/${taskId}`);
          fetchTasks();
          setModalVisible(false);
          message.success('Задача удалена успешно');
        } catch (error) {
          console.error('Error deleting task:', error);
          message.error('Произошла ошибка при удалении задачи');
        }
      },
    });
  };

  // Get name from ID for various entities
  const getEmployeeNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !employees.length) return 'Не назначено';
    return ids.map(id => {
      const employee = employees.find(emp => emp.Employee_ID === id);
      return employee ? employee.Full_Name : 'Unknown';
    }).join(', ');
  };

  const getEquipmentNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !equipment.length) return 'Не назначено';
    return ids.map(id => {
      const eq = equipment.find(eq => eq.Equipment_ID === id);
      return eq ? eq.Name : 'Unknown';
    }).join(', ');
  };

  const getTransportNames = (ids) => {
    if (!ids || !Array.isArray(ids) || !transport.length) return 'Не назначено';
    return ids.map(id => {
      const t = transport.find(t => t.Transport_ID === id);
      return t ? `${t.Brand} ${t.Model}` : 'Unknown';
    }).join(', ');
  };

  const getProcessName = (id) => {
    if (!id || !processes.length) return 'Не указано';
    const process = processes.find(p => p.Process_ID === id);
    return process ? process.Name : 'Не указано';
  };

  // Calculate schedule statistics
  const statisticsData = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.Status === 'completed').length,
    inProgressTasks: tasks.filter(task => task.Status === 'in-progress').length,
    delayedTasks: tasks.filter(task => task.Status === 'delayed').length,
  };

  return (
    <div className="schedule-container">
      <Breadcrumb className="breadcrumb-navigation">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Расписание</Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="schedule-header">
        <Title level={2}>Расписание задач</Title>
        <Button
          className="schedule-add-button"  
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddTaskModal}
          size="large"
        >
          Добавить задачу
        </Button>
      </div>
      
      <Spin spinning={isLoading}>
        {/* Statistics Cards */}
        <Row gutter={16} className="statistics-row">
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card">
              <Statistic 
                title="Всего задач" 
                value={statisticsData.totalTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card completed">
              <Statistic 
                title="Выполнено" 
                value={statisticsData.completedTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card in-progress">
              <Statistic 
                title="В процессе" 
                value={statisticsData.inProgressTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="statistic-card critical-delayed">
              <Statistic 
                title="Отложено" 
                value={statisticsData.delayedTasks} 
                prefix={<CalendarOutlined />} 
              />
            </Card>
          </Col>
        </Row>
        
        {/* Tabs with views */}
        <Tabs 
          defaultActiveKey="month" 
          onChange={setViewMode}
          className="schedule-tabs"
        >
          <TabPane tab="Месяц" key="month">
            <Card className="calendar-card">
              <Calendar 
                dateCellRender={dateCellRender} 
                onSelect={onSelect}
                locale={locale} // Добавляем русскую локализацию для календаря
              />
            </Card>
          </TabPane>
          <TabPane tab="День" key="day">
            <Card className="day-view-card">
              <div className="day-header">
                <Title level={4}>
                  Задачи на {moment(selectedDate).format('DD.MM.YYYY')}
                </Title>
                <DatePicker 
                  value={moment(selectedDate)} 
                  onChange={(date) => onSelect(date)}
                  format="DD.MM.YYYY"
                  locale={locale} // Добавляем русскую локализацию для DatePicker
                />
              </div>
              
              {selectedDateTasks.length > 0 ? (
                <div className="day-tasks">
                  {selectedDateTasks.map(task => (
                    <Card
                      key={task.Task_ID}
                      className={`task-card ${task.Status}`}
                      onClick={() => showTaskDetails(task)}
                    >
                      <div className="task-card-header">
                        <Title level={5} style={{ margin: 0 }}>{task.Title}</Title>
                        <Badge 
                          status={
                            task.Status === 'completed' ? 'success' :
                            task.Status === 'in-progress' ? 'processing' :
                            task.Status === 'delayed' ? 'error' :
                            task.Status === 'cancelled' ? 'default' : 'warning'
                          } 
                          text={statusOptions.find(s => s.value === task.Status)?.label || 'Запланировано'} 
                        />
                      </div>
                      <div className="task-card-time">
                        <ClockCircleOutlined /> {task.StartTime} - {task.EndTime}
                      </div>
                      <div className="task-card-location">
                        <EnvironmentOutlined /> {task.Location || 'Не указано'}
                      </div>
                      <div className="task-card-process">
                        {getProcessName(task.ProcessId)}
                      </div>
                      <div className="task-card-resources">
                        <div><TeamOutlined /> {getEmployeeNames(task.employeeIds)}</div>
                        {task.equipmentIds && task.equipmentIds.length > 0 && (
                          <div><ToolOutlined /> {getEquipmentNames(task.equipmentIds)}</div>
                        )}
                        {task.transportIds && task.transportIds.length > 0 && (
                          <div><CarOutlined /> {getTransportNames(task.transportIds)}</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="no-tasks">
                  <Empty description="Нет задач на выбранную дату" />
                  <Button type="primary" onClick={showAddTaskModal}>
                    Добавить задачу
                  </Button>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Spin>
      
      {/* Task Modal Form */}
      <Modal
        title={isEditing ? "Редактирование задачи" : "Добавление новой задачи"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          isEditing && (
            <Button 
              key="delete" 
              danger 
              onClick={() => handleDeleteTask(currentTask.Task_ID)}
            >
              Удалить
            </Button>
          ),
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSubmit}
            loading={isLoading}
          >
            {isEditing ? "Сохранить" : "Добавить"}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          className="task-form"
        >
          <Form.Item
            name="title"
            label="Название задачи"
            rules={[{ required: true, message: 'Пожалуйста, введите название задачи' }]}
          >
            <Input placeholder="Введите название задачи" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Пожалуйста, выберите дату' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD.MM.YYYY" 
                  locale={locale} // Добавляем русскую локализацию
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="Время"
                rules={[{ required: true, message: 'Пожалуйста, выберите время' }]}
              >
                <TimePicker.RangePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  locale={locale} // Добавляем русскую локализацию
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Местоположение"
              >
                <Input placeholder="Введите адрес или местоположение" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="processId"
                label="Процесс"
              >
                <Select placeholder="Выберите процесс">
                  {processes.map(process => (
                    <Option key={process.Process_ID} value={process.Process_ID}>
                      {process.Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employeeIds"
                label="Сотрудники"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите сотрудников"
                  optionFilterProp="children"
                  showSearch
                >
                  {employees.map(employee => (
                    <Option key={employee.Employee_ID} value={employee.Employee_ID}>
                      {employee.Full_Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="equipmentIds"
                label="Оборудование"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите оборудование"
                  optionFilterProp="children"
                  showSearch
                >
                  {equipment.map(item => (
                    <Option key={item.Equipment_ID} value={item.Equipment_ID}>
                      {item.Name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transportIds"
                label="Транспорт"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите транспорт"
                  optionFilterProp="children"
                  showSearch
                >
                  {transport.map(item => (
                    <Option key={item.Transport_ID} value={item.Transport_ID}>
                      {item.Brand} {item.Model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Приоритет"
                rules={[{ required: true, message: 'Пожалуйста, выберите приоритет' }]}
              >
                <Select placeholder="Выберите приоритет">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Статус"
                rules={[{ required: true, message: 'Пожалуйста, выберите статус' }]}
              >
                <Select placeholder="Выберите статус">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress"
                label="Прогресс выполнения"
              >
                <Slider
                  marks={{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Описание"
          >
            <TextArea 
              rows={4} 
              placeholder="Введите описание задачи" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Schedule;