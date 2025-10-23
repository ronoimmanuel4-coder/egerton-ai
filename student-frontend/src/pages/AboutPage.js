import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Chip,
  Paper,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LinkedIn,
  Twitter,
  GitHub,
  Email,
  Phone,
  LocationOn,
  EmojiObjects,
  Favorite,
  TrendingUp,
  School,
  People,
  Visibility,
  Flag,
  Star,
  Rocket,
  Psychology,
  ArrowBack,
} from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  fadeInUp,
  scrollReveal,
  scaleIn,
  rotateIn,
  floating,
  magneticHover,
  hoverLift,
  buttonPress,
} from '../utils/motionPresets';

const AboutPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 0.8, 0.6]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const missionValues = [
    {
      icon: <Visibility sx={{ fontSize: 40 }} />,
      title: 'Our Vision',
      description: 'To become Africa\'s leading educational platform, empowering millions of students with accessible, high-quality learning resources that transform academic journeys.',
      color: theme.palette.primary.main,
    },
    {
      icon: <Flag sx={{ fontSize: 40 }} />,
      title: 'Our Mission',
      description: 'To democratize education by providing Kenyan students with premium study materials, lecture recordings, and mentorship—bridging the gap between ambition and achievement.',
      color: theme.palette.secondary.main,
    },
    {
      icon: <Star sx={{ fontSize: 40 }} />,
      title: 'Our Values',
      description: 'Excellence, Innovation, Accessibility, Integrity, and Student Success. We believe every student deserves the tools to excel, regardless of their background.',
      color: theme.palette.success.main,
    },
  ];

  const achievements = [
    { label: 'Students Impacted', value: '48,000+', icon: <People /> },
    { label: 'Partner Universities', value: '25+', icon: <School /> },
    { label: 'Study Resources', value: '5,000+', icon: <EmojiObjects /> },
    { label: 'Success Rate', value: '92%', icon: <TrendingUp /> },
  ];

  const founderStory = {
    name: 'Immanuel K. Ronoh',
    title: 'Founder & CEO',
    image: '/images/founder.jpg', // Place your photo in public/images/founder.jpg
    story: [
      'The journey of EduVault began during my university years at Egerton University when I witnessed countless talented students struggling to access quality study materials. Late-night study sessions, shared notes that were barely legible, and the constant anxiety of missing crucial lectures—I lived through it all.',
      'I realized that education shouldn\'t be a privilege reserved for those who can afford expensive tutors or have access to comprehensive resources. Every student, regardless of their financial background, deserves equal opportunities to excel.',
      'With this vision, EduVault was born—a platform designed by students, for students. We\'ve partnered with top universities across Kenya to curate verified study materials, lecture recordings, and assessment tools that truly make a difference.',
      'Today, seeing thousands of students achieve their academic dreams through EduVault is the greatest reward. But this is just the beginning. We\'re committed to expanding across Africa, touching millions of lives, and revolutionizing how students learn.',
    ],
    quote: '"Education is the most powerful weapon which you can use to change the world." - Nelson Mandela',
  };

  const contactInfo = [
    {
      icon: <Email />,
      label: 'Email',
      value: 'eduvault520@gmail.com',
      link: 'mailto:eduvault520@gmail.com',
    },
    {
      icon: <Phone />,
      label: 'Phone',
      value: '+254 741 218 862',
      link: 'tel:+254741218862',
    },
    {
      icon: <LocationOn />,
      label: 'Location',
      value: 'Nakuru, Njoro - Egerton University',
      link: 'https://maps.google.com/?q=Egerton+University+Njoro',
    },
  ];

  const socialLinks = [
    { icon: <LinkedIn />, label: 'LinkedIn', link: 'https://linkedin.com/company/eduvault', color: '#0077B5' },
    { icon: <Twitter />, label: 'Twitter', link: 'https://twitter.com/eduvault', color: '#1DA1F2' },
    { icon: <GitHub />, label: 'GitHub', link: 'https://github.com/eduvault', color: '#333' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Back Button */}
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, px: { xs: 2, sm: 3 } }}>
        <Button
          component={motion.button}
          whileHover="hover"
          whileTap="tap"
          sx={{ 
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Container>

      {/* Hero Section */}
      <Box
        component={motion.div}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeInUp}
        sx={{
          position: 'relative',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.85)} 100%)`,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            animation: 'pulse 8s ease-in-out infinite',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div style={{ y: y1, opacity }}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Box
                  component={motion.div}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(255,255,255,0.4)',
                      '0 0 0 20px rgba(255,255,255,0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  sx={{
                    width: { xs: 100, sm: 120, md: 150 },
                    height: { xs: 100, sm: 120, md: 150 },
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.9) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <School sx={{ fontSize: { xs: 50, sm: 65, md: 80 }, color: theme.palette.primary.main }} />
                </Box>
              </motion.div>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  fontWeight: 900,
                  color: 'white',
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                Our Story
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  color: 'rgba(255,255,255,0.95)',
                  maxWidth: 700,
                  lineHeight: 1.8,
                }}
              >
                Transforming education in Kenya, one student at a time. Discover the passion, vision, and mission behind EduVault.
              </Typography>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Rocket sx={{ fontSize: 50, color: 'white', opacity: 0.8 }} />
              </motion.div>
            </Stack>
          </motion.div>
        </Container>

        {/* Decorative floating elements */}
        <Box
          component={motion.div}
          animate={{ y: [-20, 20], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 100,
            height: 100,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            background: alpha(theme.palette.secondary.light, 0.2),
            filter: 'blur(40px)',
          }}
        />
        <Box
          component={motion.div}
          animate={{ y: [20, -20], rotate: [360, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '15%',
            width: 150,
            height: 150,
            borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
            background: alpha(theme.palette.primary.light, 0.2),
            filter: 'blur(40px)',
          }}
        />
      </Box>

      {/* Founder Story Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={scrollReveal.container}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={5}>
              <motion.div variants={scrollReveal.item}>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  sx={{ position: 'relative' }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: 20,
                      bottom: 20,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: 8,
                      opacity: 0.2,
                      filter: 'blur(20px)',
                    }}
                  />
                  <Avatar
                    src={founderStory.image}
                    alt={founderStory.name}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '1',
                      borderRadius: 8,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                      border: `4px solid ${theme.palette.background.paper}`,
                      position: 'relative',
                    }}
                  />
                  <Box
                    component={motion.div}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    sx={{
                      position: 'absolute',
                      top: -30,
                      right: -30,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Favorite sx={{ color: 'white', fontSize: 40 }} />
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <motion.div variants={scrollReveal.item}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    {founderStory.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    {founderStory.title}
                  </Typography>
                </motion.div>

                {founderStory.story.map((paragraph, index) => (
                  <motion.div key={index} variants={scrollReveal.item} custom={index}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        color: 'text.secondary',
                        textAlign: 'justify',
                      }}
                    >
                      {paragraph}
                    </Typography>
                  </motion.div>
                ))}

                <motion.div variants={scrollReveal.item}>
                  <Paper
                    sx={{
                      p: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontStyle: 'italic',
                        color: 'text.primary',
                        lineHeight: 1.6,
                      }}
                    >
                      {founderStory.quote}
                    </Typography>
                  </Paper>
                </motion.div>
              </Stack>
            </Grid>
          </Grid>
        </motion.div>
      </Container>

      {/* Mission, Vision, Values Section */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${theme.palette.background.default} 100%)`,
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={scrollReveal.container}
          >
            <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
              <motion.div variants={scrollReveal.item}>
                <Chip
                  label="Our Foundation"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 2,
                    py: 3,
                  }}
                />
              </motion.div>
              <motion.div variants={scrollReveal.item}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '3rem' },
                    fontWeight: 800,
                  }}
                >
                  Vision, Mission & Values
                </Typography>
              </motion.div>
            </Stack>

            <Grid container spacing={4}>
              {missionValues.map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    variants={scrollReveal.item}
                    custom={index}
                    whileHover="hover"
                  >
                    <Card
                      component={motion.div}
                      variants={hoverLift}
                      sx={{
                        height: '100%',
                        background: theme.palette.background.paper,
                        border: `2px solid ${alpha(item.color, 0.1)}`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center" textAlign="center">
                          <Box
                            component={motion.div}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            sx={{
                              width: 100,
                              height: 100,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${alpha(item.color, 0.1)}, ${alpha(item.color, 0.2)})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: item.color,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Typography variant="h5" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                            {item.description}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Achievements Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={scrollReveal.container}
        >
          <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
            <motion.div variants={scrollReveal.item}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 800,
                }}
              >
                Our Impact
              </Typography>
            </motion.div>
            <motion.div variants={scrollReveal.item}>
              <Typography variant="h6" color="text.secondary" maxWidth={600}>
                Numbers that reflect our commitment to transforming education across Kenya
              </Typography>
            </motion.div>
          </Stack>

          <Grid container spacing={4}>
            {achievements.map((achievement, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  variants={scrollReveal.item}
                  custom={index}
                  whileHover="hover"
                >
                  <Card
                    component={motion.div}
                    variants={magneticHover}
                    sx={{
                      textAlign: 'center',
                      p: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        mb: 2,
                        '& svg': { fontSize: 50 },
                      }}
                    >
                      {achievement.icon}
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1,
                      }}
                    >
                      {achievement.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {achievement.label}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Contact Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.85)} 100%)`,
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={scrollReveal.container}
          >
            <Stack spacing={6} alignItems="center">
              <motion.div variants={scrollReveal.item}>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      fontWeight: 800,
                      color: 'white',
                    }}
                  >
                    Let's Connect
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 600 }}
                  >
                    Have questions or want to collaborate? We'd love to hear from you!
                  </Typography>
                </Stack>
              </motion.div>

              <Grid container spacing={4} justifyContent="center">
                {contactInfo.map((contact, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <motion.div variants={scrollReveal.item} custom={index}>
                      <Card
                        component={motion.a}
                        href={contact.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05, y: -5 }}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          textDecoration: 'none',
                          background: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer',
                        }}
                      >
                        <Box
                          sx={{
                            color: theme.palette.primary.main,
                            mb: 2,
                            '& svg': { fontSize: 40 },
                          }}
                        >
                          {contact.icon}
                        </Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {contact.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contact.value}
                        </Typography>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              <motion.div variants={scrollReveal.item}>
                <Stack direction="row" spacing={2}>
                  {socialLinks.map((social, index) => (
                    <IconButton
                      key={index}
                      component={motion.a}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      sx={{
                        width: 60,
                        height: 60,
                        background: 'white',
                        color: social.color,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        '&:hover': {
                          background: 'white',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                        },
                      }}
                    >
                      {social.icon}
                    </IconButton>
                  ))}
                </Stack>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>

        {/* Decorative background elements */}
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          sx={{
            position: 'absolute',
            top: '20%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(60px)',
          }}
        />
      </Box>
    </Box>
  );
};

export default AboutPage;
