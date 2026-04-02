import React from 'react';
import {
    Card, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, TextField, InputAdornment, Stack, Chip, Skeleton
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Search as SearchIcon, Inbox as InboxIcon } from '@mui/icons-material';

/**
 * Theme-aware data table with built-in search, empty state, and loading state
 */
const DataTable = ({
    columns = [],
    rows = [],
    loading = false,
    emptyMessage = 'No data found',
    emptyIcon,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    headerActions,
    stickyHeader = false,
    maxHeight,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Card sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            animation: 'fadeInUp 0.4s ease-out both',
            '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(12px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
            },
        }}>
            {/* Search / Actions Header */}
            {(onSearchChange || headerActions) && (
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.default, isDark ? 0.3 : 0.5),
                }}>
                    {onSearchChange && (
                        <TextField
                            size="small"
                            placeholder={searchPlaceholder}
                            value={searchValue || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                flex: 1,
                                minWidth: 200,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                },
                            }}
                        />
                    )}
                    {headerActions && (
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            {headerActions}
                        </Stack>
                    )}
                </Box>
            )}

            <TableContainer sx={{ maxHeight }}>
                <Table stickyHeader={stickyHeader} size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.id || col.label}
                                    align={col.align || 'left'}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        color: 'text.secondary',
                                        bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
                                        py: 1.5,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        whiteSpace: 'nowrap',
                                        ...(col.width && { width: col.width }),
                                    }}
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            // Loading skeletons
                            [...Array(5)].map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    {columns.map((col, j) => (
                                        <TableCell key={j}>
                                            <Skeleton
                                                variant="text"
                                                width={col.width || '80%'}
                                                height={20}
                                                animation="wave"
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <Box sx={{
                                        py: 6,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}>
                                        {emptyIcon || (
                                            <InboxIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                                        )}
                                        <Typography color="text.secondary" fontWeight={500}>
                                            {emptyMessage}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow
                                    key={row.key || index}
                                    hover
                                    sx={{
                                        transition: 'background-color 0.15s ease',
                                        animation: `fadeIn 0.3s ease-out ${index * 0.02}s both`,
                                        '@keyframes fadeIn': {
                                            from: { opacity: 0 },
                                            to: { opacity: 1 },
                                        },
                                    }}
                                >
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.id || col.label}
                                            align={col.align || 'left'}
                                            sx={{
                                                py: 1.5,
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                ...(col.cellSx || {}),
                                            }}
                                        >
                                            {col.render
                                                ? col.render(row, index)
                                                : row[col.id]
                                            }
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};

export default DataTable;
