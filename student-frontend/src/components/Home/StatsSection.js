import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Stack
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion, useMotionValue, animate } from 'framer-motion';
import { scrollReveal, hoverLift } from '../../utils/motionPresets';

const StatsSection = ({ stats = [] }) => {
  const theme = useTheme();

  const AnimatedNumber = ({ value, duration = 1.0 }) => {
    const mv = useMotionValue(0);
    const [display, setDisplay] = useState('0');

    const numericTarget = useMemo(() => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const digits = value.replace(/[^0-9]/g, '');
        return digits ? Number(digits) : 0;
      }
      return 0;
    }, [value]);

    useEffect(() => {
      const controls = animate(mv, numericTarget, { duration, ease: [0.19, 1, 0.22, 1] });
      return controls.stop;
    }, [numericTarget, duration, mv]);

    useEffect(() => {
      const unsub = mv.on('change', (latest) => {
        const rounded = Math.round(latest);
        try {
          setDisplay(rounded.toLocaleString());
        } catch {
          setDisplay(String(rounded));
        }
      });
      return () => unsub();
    }, [mv]);

    // If provided value is not numeric at all (like —), show it directly
    const isNumericish = typeof value === 'number' || (typeof value === 'string' && /\d/.test(value));
    return <>{isNumericish ? display : value}</>;
  };

  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.id || stat.label}>
              <motion.div
                variants={scrollReveal.item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.45 }}
                custom={index}
              >
                <Card
                  elevation={0}
                  sx={{ height: '100%' }}
                  component={motion.div}
                  whileHover={hoverLift.whileHover}
                  transition={hoverLift.transition}
                >
                  <CardContent>
                    <Stack spacing={2} alignItems="center" textAlign="center">
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: theme.palette.primary.main,
                          width: 56,
                          height: 56
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        <AnimatedNumber value={stat.value} />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.caption && (
                        <Typography variant="caption" color="text.secondary">
                          {stat.caption}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default StatsSection;
