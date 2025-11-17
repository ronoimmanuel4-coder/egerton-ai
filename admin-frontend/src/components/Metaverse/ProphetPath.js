import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';

const ProphetPath = ({ width = '100%', height = 500 }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const svgRef = useRef(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data generator - replace with actual API call
  const generateMockData = (count = 50) => {
    const eventTypes = ['login', 'logout', 'join_room', 'leave_room', 'message', 'file_upload'];
    const users = ['alice', 'bob', 'charlie', 'dave', 'eve'];
    const now = new Date();
    
    return Array.from({ length: count }, (_, i) => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const timestamp = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      return {
        id: `event-${i}`,
        type: eventType,
        user,
        timestamp,
        details: `${user} ${eventType.replace('_', ' ')}`,
        severity: Math.floor(Math.random() * 3) // 0: info, 1: warning, 2: error
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Fetch data based on time range
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await axios.get(`/api/metaverse/events?range=${timeRange}`, {
        //   headers: { Authorization: `Bearer ${currentUser.token}` }
        // });
        // setData(response.data);
        
        // Using mock data for now
        const mockData = generateMockData();
        setData(mockData);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError('Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, currentUser]);

  // Draw the timeline with D3
  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const innerWidth = svgRef.current.clientWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp))
      .range([0, innerWidth]);

    // Calculate positions for each event
    const y = d3.scalePoint()
      .domain(data.map((d, i) => i))
      .range([0, innerHeight])
      .padding(0.5);

    // Color scale for event types
    const color = d3.scaleOrdinal()
      .domain(['login', 'logout', 'join_room', 'leave_room', 'message', 'file_upload'])
      .range(d3.schemeTableau10);

    // Add X axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5));

    // Add Y axis with user names
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).tickFormat((d, i) => data[i].user).tickSize(0));

    // Add the line
    const line = d3.line()
      .x(d => x(d.timestamp))
      .y((d, i) => y(i));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Add the dots with tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');

    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', (d, i) => y(i))
      .attr('r', 5)
      .attr('fill', d => color(d.type))
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <div>
            <strong>${d.user}</strong><br/>
            ${d.type.replace('_', ' ')}<br/>
            <small>${d.timestamp.toLocaleString()}</small>
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - 150}, 0)`);

    const legendItems = [...new Set(data.map(d => d.type))];
    
    legend.selectAll('.legend-item')
      .data(legendItems)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('circle')
          .attr('r', 5)
          .attr('fill', color(d));
        g.append('text')
          .attr('x', 10)
          .attr('dy', '0.32em')
          .text(d.replace('_', ' '))
          .style('font-size', '12px');
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, height, theme]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // This will trigger a re-render with the new dimensions
      setData([...data]);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Typography>Loading timeline data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" component="h2">Prophet Path: Activity Timeline</Typography>
        <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="1h">Last hour</MenuItem>
            <MenuItem value="24h">Last 24 hours</MenuItem>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box 
        ref={svgRef} 
        component="svg"
        sx={{
          width: '100%',
          height: height,
          '& .tick line, & .domain': {
            stroke: theme.palette.divider,
          },
          '& .tick text': {
            fill: theme.palette.text.secondary,
            fontSize: '0.75rem',
          },
        }}
      />
      
      <Typography variant="caption" color="textSecondary">
        Hover over events to see details. Click and drag to zoom, double-click to reset view.
      </Typography>
    </Paper>
  );
};

export default ProphetPath;
