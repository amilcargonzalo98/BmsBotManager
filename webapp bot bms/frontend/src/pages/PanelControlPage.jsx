import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchMessages } from '../services/twilio';
import { fetchPoints } from '../services/points';
import { fetchEvents } from '../services/events';
import { fetchClients } from '../services/clients';
import { fetchGroups } from '../services/groups';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const periodOptions = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
];

const periodDurations = {
  diaria: MS_IN_DAY,
  semanal: 7 * MS_IN_DAY,
  mensual: 30 * MS_IN_DAY,
};

const messagesColors = ['#1e88e5', '#43a047'];
const pointsColors = ['#8e24aa', '#ff7043', '#3949ab', '#26a69a', '#d81b60', '#00897b'];
const eventsColor = '#fb8c00';

const chartContainerSx = {
  flexGrow: 1,
  minHeight: 280,
};

const centerContentSx = {
  ...chartContainerSx,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function PanelControlPage() {
  const [messagesPeriod, setMessagesPeriod] = useState('semanal');
  const [eventsPeriod, setEventsPeriod] = useState('semanal');

  const [messages, setMessages] = useState([]);
  const [points, setPoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        const res = await fetchMessages();
        if (!active) {
          return;
        }
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error cargando mensajes', error);
        if (active) {
          setMessages([]);
        }
      } finally {
        if (active) {
          setLoadingMessages(false);
        }
      }
    };

    const loadPoints = async () => {
      try {
        const res = await fetchPoints();
        if (!active) {
          return;
        }
        setPoints(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error cargando puntos', error);
        if (active) {
          setPoints([]);
        }
      } finally {
        if (active) {
          setLoadingPoints(false);
        }
      }
    };

    const loadEvents = async () => {
      try {
        const limit = 200;
        let page = 1;
        const collected = [];
        let keepFetching = true;

        while (keepFetching) {
          const res = await fetchEvents({ page, limit });
          if (!active) {
            return;
          }
          const payload = res.data || {};
          const pageData = Array.isArray(payload.data) ? payload.data : [];
          collected.push(...pageData);

          const pagination = payload.pagination;
          if (pagination) {
            const total = typeof pagination.total === 'number' ? pagination.total : collected.length;
            const totalPages =
              typeof pagination.totalPages === 'number'
                ? pagination.totalPages
                : Math.ceil(total / limit) || 1;
            keepFetching = page < totalPages && collected.length < total;
          } else {
            keepFetching = pageData.length === limit && pageData.length > 0;
          }

          page += 1;

          if (pageData.length === 0 || page > 20) {
            keepFetching = false;
          }
        }

        if (!active) {
          return;
        }
        setEvents(collected);
      } catch (error) {
        console.error('Error cargando eventos', error);
        if (active) {
          setEvents([]);
        }
      } finally {
        if (active) {
          setLoadingEvents(false);
        }
      }
    };

    const loadClients = async () => {
      try {
        const res = await fetchClients();
        if (!active) {
          return;
        }
        setClients(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error cargando clientes', error);
        if (active) {
          setClients([]);
        }
      } finally {
        if (active) {
          setLoadingClients(false);
        }
      }
    };

    const loadGroups = async () => {
      try {
        const res = await fetchGroups();
        if (!active) {
          return;
        }
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error cargando grupos', error);
      }
    };

    loadMessages();
    loadPoints();
    loadEvents();
    loadClients();
    loadGroups();

    return () => {
      active = false;
    };
  }, []);

  const groupNameById = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      if (group?._id) {
        map.set(group._id, group.groupName || group.name || group._id);
      }
    });
    return map;
  }, [groups]);

  const resolveGroupName = useCallback((value) => {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return groupNameById.get(value) || value;
    }
    if (typeof value === 'object') {
      if (value.groupName) {
        return value.groupName;
      }
      if (value.name) {
        return value.name;
      }
      if (value._id) {
        return groupNameById.get(value._id) || '';
      }
    }
    return '';
  }, [groupNameById]);

  const messagesStats = useMemo(() => {
    const template = {
      diaria: { enviados: 0, recibidos: 0 },
      semanal: { enviados: 0, recibidos: 0 },
      mensual: { enviados: 0, recibidos: 0 },
    };
    if (!messages.length) {
      return template;
    }
    const now = Date.now();

    messages.forEach((message) => {
      const rawTimestamp =
        message.timestamp ||
        message.dateCreated ||
        message.dateSent ||
        message.createdAt ||
        message.updatedAt;
      const timestamp = rawTimestamp ? new Date(rawTimestamp).getTime() : Number.NaN;
      if (Number.isNaN(timestamp) || timestamp > now) {
        return;
      }

      const direction = typeof message.direction === 'string' ? message.direction.toLowerCase() : '';
      const key = direction.startsWith('outbound') ? 'enviados' : 'recibidos';

      Object.entries(periodDurations).forEach(([period, duration]) => {
        if (now - timestamp <= duration) {
          template[period][key] += 1;
        }
      });
    });

    return template;
  }, [messages]);

  const messagesChartData = useMemo(() => {
    const stats = messagesStats[messagesPeriod] || { enviados: 0, recibidos: 0 };
    return [
      { name: 'Enviados', value: stats.enviados },
      { name: 'Recibidos', value: stats.recibidos },
    ];
  }, [messagesPeriod, messagesStats]);

  const pointsChartData = useMemo(() => {
    if (!points.length) {
      return [];
    }
    const counts = new Map();
    points.forEach((point) => {
      const groupLabel =
        resolveGroupName(point.groupId) ||
        resolveGroupName(point.clientId?.groupId) ||
        resolveGroupName(point.clientId?.group) ||
        resolveGroupName(point.pointGroup) ||
        'Sin grupo';
      counts.set(groupLabel, (counts.get(groupLabel) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [points, resolveGroupName]);

  const eventsStats = useMemo(() => {
    const template = {
      diaria: new Map(),
      semanal: new Map(),
      mensual: new Map(),
    };
    if (!events.length) {
      return {
        diaria: [],
        semanal: [],
        mensual: [],
      };
    }
    const now = Date.now();

    events.forEach((event) => {
      const rawTimestamp = event.timestamp || event.date || event.createdAt || event.updatedAt;
      const timestamp = rawTimestamp ? new Date(rawTimestamp).getTime() : Number.NaN;
      if (Number.isNaN(timestamp) || timestamp > now) {
        return;
      }

      const groupLabel =
        resolveGroupName(event.groupId) ||
        resolveGroupName(event.pointId?.groupId) ||
        resolveGroupName(event.pointId?.clientId?.groupId) ||
        resolveGroupName(event.clientId?.groupId) ||
        'Sin grupo';

      Object.entries(periodDurations).forEach(([period, duration]) => {
        if (now - timestamp <= duration) {
          const map = template[period];
          map.set(groupLabel, (map.get(groupLabel) || 0) + 1);
        }
      });
    });

    const toArray = (map) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, eventos: count }))
        .sort((a, b) => b.eventos - a.eventos);

    return {
      diaria: toArray(template.diaria),
      semanal: toArray(template.semanal),
      mensual: toArray(template.mensual),
    };
  }, [events, resolveGroupName]);

  const eventsChartData = useMemo(
    () => eventsStats[eventsPeriod] || [],
    [eventsStats, eventsPeriod],
  );

  const eventsTotal = useMemo(
    () =>
      eventsChartData.reduce(
        (sum, item) => sum + (typeof item.eventos === 'number' ? item.eventos : 0),
        0,
      ),
    [eventsChartData],
  );

  const clientsTotals = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.enabled !== false).length;
    return { total, active };
  }, [clients]);

  const hasMessagesData = messagesChartData.some((item) => item.value > 0);
  const hasPointsData = pointsChartData.length > 0;
  const hasEventsData = eventsChartData.length > 0;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Panel de control
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Mensajes
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140, mb: 2, alignSelf: 'flex-start' }}>
              <InputLabel id="messages-period-label">Periodo</InputLabel>
              <Select
                labelId="messages-period-label"
                value={messagesPeriod}
                label="Periodo"
                onChange={(event) => setMessagesPeriod(event.target.value)}
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingMessages ? (
              <Box sx={centerContentSx}>
                <CircularProgress size={32} />
              </Box>
            ) : hasMessagesData ? (
              <Box sx={chartContainerSx}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={messagesChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={0}
                      stroke="none"
                    >
                      {messagesChartData.map((entry, index) => (
                        <Cell
                          key={`messages-${entry.name}`}
                          fill={messagesColors[index % messagesColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} mensajes`, name]} />
                    <Legend
                      formatter={(value, entry) => {
                        const label =
                          typeof value === 'string'
                            ? value
                            : value != null
                              ? String(value)
                              : '';
                        const total = entry?.payload?.value ?? 0;
                        return `${label} (${total})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={centerContentSx}>
                <Typography variant="body2" color="text.secondary">
                  No hay mensajes registrados en el periodo seleccionado.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Puntos por grupo
            </Typography>
            {loadingPoints ? (
              <Box sx={centerContentSx}>
                <CircularProgress size={32} />
              </Box>
            ) : hasPointsData ? (
              <Box sx={chartContainerSx}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pointsChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius="80%"
                      paddingAngle={0}
                      stroke="none"
                      label={({ name, value }) => {
                        const labelName =
                          typeof name === 'string'
                            ? name
                            : name != null
                              ? String(name)
                              : '';
                        const labelValue = typeof value === 'number' ? value : 0;
                        return `${labelName} (${labelValue})`;
                      }}
                    >
                      {pointsChartData.map((entry, index) => (
                        <Cell
                          key={`points-${entry.name}`}
                          fill={pointsColors[index % pointsColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} puntos`, name]} />
                    <Legend
                      formatter={(value, entry) => {
                        const label =
                          typeof value === 'string'
                            ? value
                            : value != null
                              ? String(value)
                              : '';
                        const total = entry?.payload?.value ?? 0;
                        return `${label} (${total})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={centerContentSx}>
                <Typography variant="body2" color="text.secondary">
                  No hay puntos registrados para mostrar.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Eventos registrados
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140, mb: 2, alignSelf: 'flex-start' }}>
              <InputLabel id="events-period-label">Periodo</InputLabel>
              <Select
                labelId="events-period-label"
                value={eventsPeriod}
                label="Periodo"
                onChange={(event) => setEventsPeriod(event.target.value)}
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingEvents ? (
              <Box sx={centerContentSx}>
                <CircularProgress size={32} />
              </Box>
            ) : hasEventsData ? (
              <Box sx={chartContainerSx}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value, name) => [`${value} eventos`, name]} />
                    <Legend
                      formatter={(value) => {
                        const label =
                          typeof value === 'string'
                            ? value
                            : value != null
                              ? String(value)
                              : '';
                        return `${label} (${eventsTotal})`;
                      }}
                    />
                    <Bar dataKey="eventos" name="Eventos" fill={eventsColor} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={centerContentSx}>
                <Typography variant="body2" color="text.secondary">
                  No hay eventos registrados en el periodo seleccionado.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {loadingClients ? (
              <CircularProgress size={32} />
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Clientes registrados
                </Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {clientsTotals.total.toLocaleString('es-AR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {clientsTotals.active.toLocaleString('es-AR')} activos actualmente.
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
