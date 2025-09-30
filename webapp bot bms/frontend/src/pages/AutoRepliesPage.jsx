import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { fetchAutoReplies, createAutoReply, updateAutoReply, deleteAutoReply } from '../services/autoReplies';
import { fetchGroups } from '../services/groups';
import { fetchPoints } from '../services/points';

const emojiPalette = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🤖', '⚙️', '✅', '⚠️',
  '🔥', '📊', '📈', '🕒', '📅', '🔧', '💡', '📍', '🚨', '📞',
];

const defaultForm = {
  id: null,
  groupId: '',
  keyword: '',
  responseBody: '',
  isActive: true,
  variables: [],
};

const sanitizeToken = (value) => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

const buildPlaceholder = (token) => (token ? `{{${token}}}` : '');

export default function AutoRepliesPage() {
  const [autoReplies, setAutoReplies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [points, setPoints] = useState([]);
  const [filterGroupId, setFilterGroupId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const pointOptions = useMemo(
    () => points.map((p) => ({
      value: p._id,
      label: p.pointName || p.pointId || 'Sin nombre',
      helper: p.pointId ? `${p.pointName || 'Sin nombre'} (${p.pointId})` : p.pointName || 'Sin nombre',
    })),
    [points],
  );

  const loadAutoReplies = async (groupId) => {
    try {
      setLoading(true);
      setListError('');
      const { data } = await fetchAutoReplies(groupId);
      setAutoReplies(data || []);
    } catch (err) {
      console.error('Error cargando respuestas automáticas', err);
      setListError('No se pudieron cargar las respuestas automáticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups()
      .then((res) => setGroups(res.data || []))
      .catch((err) => console.error('Error cargando grupos', err));
    fetchPoints()
      .then((res) => setPoints(res.data || []))
      .catch((err) => console.error('Error cargando puntos', err));
    loadAutoReplies('');
  }, []);

  useEffect(() => {
    loadAutoReplies(filterGroupId);
  }, [filterGroupId]);

  const handleOpenDialog = (reply = null) => {
    if (reply) {
      setFormState({
        id: reply._id || reply.id || reply._id?.toString?.() || null,
        groupId: reply.groupId?._id || reply.groupId?.id || reply.groupId || '',
        keyword: reply.keyword || '',
        responseBody: reply.responseBody || '',
        isActive: reply.isActive !== undefined ? reply.isActive : true,
        variables: Array.isArray(reply.points)
          ? reply.points.map((p, index) => ({
            alias: p.alias || `Variable ${index + 1}`,
            token: p.token || sanitizeToken(p.alias || `variable_${index + 1}`),
            pointId: typeof p.pointId === 'object' ? p.pointId?._id || p.pointId?.id : p.pointId,
          }))
          : [],
      });
    } else {
      setFormState({ ...defaultForm, variables: [] });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormState(defaultForm);
    setFormError('');
    setSaving(false);
    setEmojiAnchor(null);
  };

  const handleVariableChange = (index, field, value) => {
    setFormState((prev) => {
      const variables = prev.variables.map((variable, idx) => {
        if (idx !== index) return variable;
        if (field === 'token') {
          const sanitized = sanitizeToken(value);
          return { ...variable, token: sanitized };
        }
        return { ...variable, [field]: value };
      });
      return { ...prev, variables };
    });
  };

  const handleVariablePointChange = (index, option) => {
    setFormState((prev) => {
      const variables = prev.variables.map((variable, idx) =>
        idx === index ? { ...variable, pointId: option ? option.value : '' } : variable,
      );
      return { ...prev, variables };
    });
  };

  const handleAddVariable = () => {
    setFormState((prev) => {
      const nextIndex = prev.variables.length + 1;
      const alias = `Variable ${nextIndex}`;
      const token = sanitizeToken(alias) || `variable_${nextIndex}`;
      return {
        ...prev,
        variables: [...prev.variables, { alias, token, pointId: '' }],
      };
    });
  };

  const handleRemoveVariable = (index) => {
    setFormState((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, idx) => idx !== index),
    }));
  };

  const handleInsertPlaceholder = (token) => {
    const placeholder = buildPlaceholder(token);
    if (!placeholder) return;
    setFormState((prev) => ({
      ...prev,
      responseBody: prev.responseBody ? `${prev.responseBody}${prev.responseBody.endsWith(' ') ? '' : ' '}${placeholder}` : placeholder,
    }));
  };

  const handleEmojiButtonClick = (event) => {
    setEmojiAnchor(event.currentTarget);
  };

  const handleEmojiSelect = (emoji) => {
    setFormState((prev) => ({
      ...prev,
      responseBody: `${prev.responseBody || ''}${emoji}`,
    }));
    setEmojiAnchor(null);
  };

  const handleSave = async () => {
    const trimmedKeyword = formState.keyword.trim();
    const trimmedMessage = formState.responseBody.trim();

    if (!formState.groupId) {
      setFormError('Selecciona el grupo al que pertenece la respuesta automática.');
      return;
    }

    if (!trimmedKeyword) {
      setFormError('La palabra clave es obligatoria.');
      return;
    }

    if (!trimmedMessage) {
      setFormError('El cuerpo de la respuesta no puede estar vacío.');
      return;
    }

    const cleanedVariables = formState.variables.map((variable) => ({
      alias: (variable.alias || '').trim(),
      token: sanitizeToken(variable.token || variable.alias),
      pointId: variable.pointId,
    })).filter((variable) => variable.alias && variable.token && variable.pointId);

    if (formState.variables.length > 0 && cleanedVariables.length !== formState.variables.length) {
      setFormError('Revisa las variables: todas deben tener nombre, placeholder y punto asignado.');
      return;
    }

    const payload = {
      groupId: formState.groupId,
      keyword: trimmedKeyword,
      responseBody: formState.responseBody,
      isActive: formState.isActive,
      points: cleanedVariables,
    };

    try {
      setSaving(true);
      setFormError('');
      if (formState.id) {
        await updateAutoReply(formState.id, payload);
      } else {
        await createAutoReply(payload);
      }
      await loadAutoReplies(filterGroupId);
      handleCloseDialog();
    } catch (err) {
      console.error('Error guardando respuesta automática', err);
      const message = err?.response?.data?.message || 'No se pudo guardar la respuesta automática.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reply) => {
    const confirmed = window.confirm('¿Eliminar la respuesta automática seleccionada?');
    if (!confirmed) return;
    try {
      await deleteAutoReply(reply._id || reply.id);
      await loadAutoReplies(filterGroupId);
    } catch (err) {
      console.error('Error eliminando respuesta automática', err);
      alert('No se pudo eliminar la respuesta automática.');
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Respuestas automáticas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nueva respuesta automática
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-group-label">Grupo</InputLabel>
          <Select
            labelId="filter-group-label"
            value={filterGroupId}
            label="Grupo"
            onChange={(event) => setFilterGroupId(event.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                {group.groupName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {listError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Palabra clave</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Variables</TableCell>
              <TableCell>Activa</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Cargando respuestas automáticas...
                </TableCell>
              </TableRow>
            ) : autoReplies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay respuestas automáticas registradas.
                </TableCell>
              </TableRow>
            ) : (
              autoReplies.map((reply) => (
                <TableRow key={reply._id || reply.id}>
                  <TableCell>{reply.keyword}</TableCell>
                  <TableCell>{reply.groupId?.groupName || reply.groupId?.name || 'Sin grupo'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {(reply.points || []).map((point, index) => (
                        <Chip
                          key={`${reply._id || reply.id}-point-${index}`}
                          label={`${point.alias}${point.pointId?.pointName ? ` → ${point.pointId.pointName}` : ''}`}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{reply.isActive ? 'Sí' : 'No'}</TableCell>
                  <TableCell sx={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reply.responseBody}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(reply)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" onClick={() => handleDelete(reply)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{formState.id ? 'Editar respuesta automática' : 'Nueva respuesta automática'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="group-select-label">Grupo</InputLabel>
              <Select
                labelId="group-select-label"
                value={formState.groupId}
                label="Grupo"
                onChange={(event) => setFormState((prev) => ({ ...prev, groupId: event.target.value }))}
              >
                {groups.map((group) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.groupName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Palabra clave"
              value={formState.keyword}
              onChange={(event) => setFormState((prev) => ({ ...prev, keyword: event.target.value }))}
              helperText="Se buscará una coincidencia exacta (sin distinguir mayúsculas/minúsculas)."
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Mensaje de respuesta"
                value={formState.responseBody}
                onChange={(event) => setFormState((prev) => ({ ...prev, responseBody: event.target.value }))}
                fullWidth
                multiline
                minRows={4}
                helperText="Puedes insertar variables usando los placeholders definidos abajo."
              />
              <Tooltip title="Insertar emoji">
                <IconButton color="primary" onClick={handleEmojiButtonClick} sx={{ mt: 0.5 }}>
                  <EmojiEmotionsIcon />
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', maxWidth: 260, p: 1, gap: 1 }}>
                  {emojiPalette.map((emoji) => (
                    <Button key={emoji} onClick={() => handleEmojiSelect(emoji)} sx={{ minWidth: 0 }}>
                      <Typography component="span" sx={{ fontSize: 22 }}>{emoji}</Typography>
                    </Button>
                  ))}
                </Box>
              </Popover>
            </Box>

            <FormControlLabel
              control={(
                <Switch
                  checked={formState.isActive}
                  onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
              )}
              label="Respuesta activa"
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Variables dinámicas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Asocia puntos y define un placeholder para usar en el mensaje (por ejemplo {`{{variable_1}}`}).
              </Typography>
              <Stack spacing={2}>
                {formState.variables.map((variable, index) => {
                  const selectedOption = pointOptions.find((option) => option.value === variable.pointId) || null;
                  return (
                    <Box
                      key={`variable-${index}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto auto' },
                        gap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label="Nombre de la variable"
                        value={variable.alias}
                        onChange={(event) => handleVariableChange(index, 'alias', event.target.value)}
                      />
                      <TextField
                        label="Placeholder"
                        value={variable.token}
                        onChange={(event) => handleVariableChange(index, 'token', event.target.value)}
                        helperText={`Se insertará como ${buildPlaceholder(variable.token)}`}
                      />
                      <Autocomplete
                        options={pointOptions}
                        value={selectedOption}
                        onChange={(_event, option) => handleVariablePointChange(index, option)}
                        getOptionLabel={(option) => option.helper || option.label}
                        renderInput={(params) => <TextField {...params} label="Punto" />}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => handleInsertPlaceholder(variable.token)}
                        disabled={!variable.token}
                      >
                        Insertar en mensaje
                      </Button>
                      <IconButton color="error" onClick={() => handleRemoveVariable(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={handleAddVariable}>
                Agregar variable
              </Button>
            </Box>

            {formError && (
              <Alert severity="error">{formError}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
