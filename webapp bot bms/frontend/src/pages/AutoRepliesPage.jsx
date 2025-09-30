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

const attributeOptions = [
  { value: 'lastPresentValue', label: 'Último valor reportado' },
  { value: 'lastUpdate', label: 'Fecha de última actualización' },
  { value: 'pointName', label: 'Nombre del punto' },
];

const attributeLabels = {
  lastPresentValue: 'Último valor',
  lastUpdate: 'Última actualización',
  pointName: 'Nombre del punto',
};

const operatorOptions = [
  { value: '==', label: 'Igual a' },
  { value: '!=', label: 'Distinto de' },
  { value: '>', label: 'Mayor que' },
  { value: '>=', label: 'Mayor o igual que' },
  { value: '<', label: 'Menor que' },
  { value: '<=', label: 'Menor o igual que' },
];

const defaultForm = {
  id: null,
  groupId: '',
  keyword: '',
  responseBody: '',
  isActive: true,
  variables: [],
};

const buildDefaultVariable = (index) => {
  const tokenBase = `variable_${index + 1}`;
  const token = sanitizeToken(tokenBase) || tokenBase;
  return {
    token,
    pointId: '',
    attribute: 'lastPresentValue',
    transformations: [],
    fallback: '',
  };
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
            token: p.token || sanitizeToken(p.alias || `variable_${index + 1}`),
            pointId: typeof p.pointId === 'object' ? p.pointId?._id || p.pointId?.id : p.pointId,
            attribute: p.attribute || 'lastPresentValue',
            transformations: Array.isArray(p.transformations)
              ? p.transformations.map((rule) => ({
                operator: rule.operator || '==',
                value: rule.value ?? '',
                output: rule.output ?? '',
              }))
              : [],
            fallback: p.fallback ?? '',
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

  const handleAddTransformation = (variableIndex) => {
  setFormState((prev) => {
    const variables = prev.variables.map((variable, idx) => {
      if (idx !== variableIndex) return variable;
      const transformations = Array.isArray(variable.transformations)
        ? [...variable.transformations]
        : [];
      return {
        ...variable,
        transformations: [...transformations, { operator: '==', value: '', output: '' }],
      };
    });
    return { ...prev, variables };
  });
};

  const handleTransformationChange = (variableIndex, transformationIndex, field, value) => {
  setFormState((prev) => {
    const variables = prev.variables.map((variable, idx) => {
      if (idx !== variableIndex) return variable;
      const transformations = Array.isArray(variable.transformations)
        ? variable.transformations.map((rule, rIdx) => {
            if (rIdx !== transformationIndex) return rule;
            return { ...rule, [field]: value };
          })
        : [];
      return { ...variable, transformations };
    });
    return { ...prev, variables };
  });
};

  const handleRemoveTransformation = (variableIndex, transformationIndex) => {
  setFormState((prev) => {
    const variables = prev.variables.map((variable, idx) => {
      if (idx !== variableIndex) return variable;
      const transformations = Array.isArray(variable.transformations)
        ? variable.transformations.filter((_, rIdx) => rIdx !== transformationIndex)
        : [];
      return { ...variable, transformations };
    });
    return { ...prev, variables };
  });
};

  const handleAddVariable = () => {
  setFormState((prev) => {
    const nextIndex = prev.variables.length;
    return {
      ...prev,
      variables: [...prev.variables, buildDefaultVariable(nextIndex)],
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

    const cleanedVariables = formState.variables
      .map((variable) => {
        const token = sanitizeToken(variable.token || '');
        const pointId = variable.pointId;
        if (!token || !pointId) return null;

        const attribute = attributeOptions.some((option) => option.value === variable.attribute)
          ? variable.attribute
          : 'lastPresentValue';

        const transformations = Array.isArray(variable.transformations)
          ? variable.transformations
              .map((rule) => {
                const operator = operatorOptions.some((option) => option.value === rule.operator)
                  ? rule.operator
                  : '==';
                const value = rule.value ?? '';
                const output = rule.output ?? '';
                if (value === '' || output === '') return null;
                return {
                  operator,
                  value: value.toString(),
                  output: output.toString(),
                };
              })
              .filter(Boolean)
          : [];

        const fallback = (() => {
          if (typeof variable.fallback === 'string') return variable.fallback;
          if (typeof variable.fallback === 'number') return variable.fallback.toString();
          return '';
        })();

        return {
          token,
          pointId,
          attribute,
          transformations,
          fallback,
        };
      })
      .filter(Boolean);

    if (formState.variables.length > 0 && cleanedVariables.length !== formState.variables.length) {
      setFormError('Revisa las variables: todas deben tener placeholder, punto y atributo asignado.');
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
                      {(reply.points || []).map((point, index) => {
                        const attributeLabel = attributeLabels[point.attribute] || attributeLabels.lastPresentValue;
                        const pointName = point.pointId?.pointName;
                        const translationsCount = Array.isArray(point.transformations)
                          ? point.transformations.length
                          : 0;
                        const labelParts = [
                          point.token ? `{{${point.token}}}` : 'Variable',
                          pointName ? `→ ${pointName}` : null,
                          attributeLabel ? `(${attributeLabel})` : null,
                          translationsCount > 0
                            ? `${translationsCount} ${translationsCount === 1 ? 'regla' : 'reglas'}`
                            : null,
                        ].filter(Boolean);
                        return (
                          <Chip
                            key={`${reply._id || reply.id}-point-${index}`}
                            label={labelParts.join(' ')}
                            size="small"
                          />
                        );
                      })}
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
                Asocia puntos, elige qué dato quieres usar y define el placeholder para insertarlo en el mensaje (por ejemplo {`{{variable_1}}`}).
              </Typography>
              <Stack spacing={2}>
                {formState.variables.map((variable, index) => {
                  const selectedOption = pointOptions.find((option) => option.value === variable.pointId) || null;
                  return (
                    <Paper key={`variable-${index}`} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                          <TextField
                            label="Placeholder"
                            value={variable.token}
                            onChange={(event) => handleVariableChange(index, 'token', event.target.value)}
                            helperText={`Se insertará como ${buildPlaceholder(variable.token)}`}
                            fullWidth
                          />
                          <Autocomplete
                            options={pointOptions}
                            value={selectedOption}
                            onChange={(_event, option) => handleVariablePointChange(index, option)}
                            getOptionLabel={(option) => option.helper || option.label}
                            renderInput={(params) => <TextField {...params} label="Punto" />}
                            sx={{ minWidth: { md: 240 } }}
                          />
                          <FormControl sx={{ minWidth: { md: 220 } }} fullWidth>
                            <InputLabel id={`attribute-label-${index}`}>Atributo</InputLabel>
                            <Select
                              labelId={`attribute-label-${index}`}
                              label="Atributo"
                              value={variable.attribute || 'lastPresentValue'}
                              onChange={(event) => handleVariableChange(index, 'attribute', event.target.value)}
                            >
                              {attributeOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          alignItems={{ md: 'center' }}
                        >
                          <TextField
                            label="Valor por defecto"
                            value={variable.fallback}
                            onChange={(event) => handleVariableChange(index, 'fallback', event.target.value)}
                            helperText="Se usará cuando no exista dato o ninguna condición aplique"
                            fullWidth
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
                        </Stack>

                        <Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: variable.transformations?.length ? 1 : 0 }}
                          >
                            <Typography variant="subtitle2">Traducciones condicionales</Typography>
                            <Button size="small" onClick={() => handleAddTransformation(index)}>
                              Agregar traducción
                            </Button>
                          </Stack>
                          {(!variable.transformations || variable.transformations.length === 0) && (
                            <Typography variant="body2" color="text.secondary">
                              Puedes traducir el valor del punto a texto agregando condiciones.
                            </Typography>
                          )}
                          {variable.transformations && variable.transformations.length > 0 && (
                            <Stack spacing={1}>
                              {variable.transformations.map((rule, ruleIndex) => (
                                <Stack
                                  key={`variable-${index}-rule-${ruleIndex}`}
                                  direction={{ xs: 'column', md: 'row' }}
                                  spacing={1}
                                  alignItems={{ md: 'center' }}
                                >
                                  <FormControl sx={{ minWidth: 140 }}>
                                    <InputLabel id={`operator-label-${index}-${ruleIndex}`}>Operador</InputLabel>
                                    <Select
                                      labelId={`operator-label-${index}-${ruleIndex}`}
                                      label="Operador"
                                      value={rule.operator || '=='}
                                      onChange={(event) =>
                                        handleTransformationChange(index, ruleIndex, 'operator', event.target.value)
                                      }
                                    >
                                      {operatorOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    label="Valor a comparar"
                                    value={rule.value ?? ''}
                                    onChange={(event) =>
                                      handleTransformationChange(index, ruleIndex, 'value', event.target.value)
                                    }
                                    fullWidth
                                  />
                                  <TextField
                                    label="Texto a mostrar"
                                    value={rule.output ?? ''}
                                    onChange={(event) =>
                                      handleTransformationChange(index, ruleIndex, 'output', event.target.value)
                                    }
                                    fullWidth
                                  />
                                  <IconButton
                                    color="error"
                                    onClick={() => handleRemoveTransformation(index, ruleIndex)}
                                    sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
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
