import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Avatar } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

/**
 * Reusable Stats Card for all dashboards
 * 
 * @param {Object} props
 * @param {string} props.title - Label text
 * @param {string|number} props.value - Primary metric value
 * @param {React.ReactNode} props.icon - MUI icon element
 * @param {string} props.color - Theme color key or hex
 * @param {string} [props.trend] - Trend text (e.g. "+5% this week")
 * @param {boolean} [props.trendUp] - Whether trend is positive
 * @param {string} [props.subtitle] - Subtitle below value
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.variant] - "default" | "gradient" | "outlined"
 * @param {number} [props.animationDelay] - Stagger index
 */
const StatsCard = ({
    title,
    value,
    icon,
    color = '#4F46E5',
    trend,
    trendUp = true,
    subtitle,
    onClick,
    variant = 'default',
    animationDelay = 0,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Resolve color - could be theme key like 'primary.main' or hex
    const resolvedColor = color.includes('.')
        ? color.split('.').reduce((obj, key) => obj?.[key], theme.palette) || color
        : color;

    const getCardStyles = () => {
        switch (variant) {
            case 'gradient':
                return {
                    background: `linear-gradient(135deg, ${resolvedColor} 0%, ${alpha(resolvedColor, 0.7)} 100%)`,
                    color: '#FFFFFF',
                    border: 'none',
                    boxShadow: `0 8px 24px ${alpha(resolvedColor, 0.3)}`,
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 32px ${alpha(resolvedColor, 0.4)}`,
                    },
                };
            case 'outlined':
                return {
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: resolvedColor,
                        boxShadow: `0 4px 16px ${alpha(resolvedColor, 0.1)}`,
                    },
                };
            default:
                return {
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 24px ${alpha(resolvedColor, isDark ? 0.2 : 0.12)}`,
                        borderColor: alpha(resolvedColor, 0.3),
                    },
                };
        }
    };

    return (
        <Card
            onClick={onClick}
            sx={{
                height: '100%',
                borderRadius: 3,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                animation: `fadeInUp 0.4s ease-out ${animationDelay * 0.001}s both`,
                '@keyframes fadeInUp': {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                ...getCardStyles(),
            }}
        >
            {/* Decorative background icon */}
            <Box sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                opacity: variant === 'gradient' ? 0.15 : 0.05,
            }}>
                {icon && React.cloneElement(icon, { sx: { fontSize: 100 } })}
            </Box>

            <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{
                                color: variant === 'gradient' ? alpha('#fff', 0.85) : 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: 0.8,
                                mb: 0.5,
                                display: 'block',
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                color: variant === 'gradient' ? '#fff' : 'text.primary',
                                lineHeight: 1.2,
                                mb: subtitle ? 0.5 : 0,
                            }}
                        >
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="body2"
                                sx={{ color: variant === 'gradient' ? alpha('#fff', 0.7) : 'text.secondary' }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            width: 48,
                            height: 48,
                            bgcolor: variant === 'gradient'
                                ? alpha('#fff', 0.2)
                                : alpha(resolvedColor, isDark ? 0.15 : 0.08),
                            color: variant === 'gradient' ? '#fff' : resolvedColor,
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>

                {trend && (
                    <Box sx={{ mt: 1.5 }}>
                        <Chip
                            size="small"
                            icon={trendUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={trend}
                            sx={{
                                height: 24,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                bgcolor: variant === 'gradient'
                                    ? alpha('#fff', 0.2)
                                    : alpha(trendUp ? theme.palette.success.main : theme.palette.error.main, 0.08),
                                color: variant === 'gradient'
                                    ? '#fff'
                                    : trendUp ? 'success.main' : 'error.main',
                                '& .MuiChip-icon': {
                                    color: 'inherit',
                                    fontSize: '0.85rem',
                                },
                            }}
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default StatsCard;
