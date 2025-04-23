"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface CustomScrollbarProps {
  containerRef: React.RefObject<HTMLDivElement>
  height?: string
  width?: string
  position?: "left" | "right"
  color?: string
  hoverColor?: string
  trackColor?: string
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  containerRef,
  height = "80%",
  width = "8px",
  position = "right",
  color = "rgba(249, 115, 22, 0.6)",  // Updated to orange (primary) with transparency
  hoverColor = "rgba(249, 115, 22, 0.9)",  // Brighter orange on hover
  trackColor = "rgba(51, 65, 85, 0.1)",  // Slight dark background for better contrast
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [thumbHeight, setThumbHeight] = useState(20)
  const [thumbPosition, setThumbPosition] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const scrollbarRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  // Calculate thumb height based on content
  useEffect(() => {
    if (!containerRef.current) return

    const calculateThumbHeight = () => {
      const container = containerRef.current
      if (!container) return

      const viewportHeight = container.clientHeight
      const contentHeight = container.scrollHeight

      // Calculate thumb height proportionally
      const ratio = viewportHeight / contentHeight
      const calculatedHeight = Math.max(20, viewportHeight * ratio)
      setThumbHeight(calculatedHeight)
    }

    calculateThumbHeight()

    // Update thumb position when container scrolls
    const handleScroll = () => {
      if (!containerRef.current || isDragging) return

      const container = containerRef.current
      const scrollRatio = container.scrollTop / (container.scrollHeight - container.clientHeight)
      const trackHeight = scrollbarRef.current?.clientHeight || 0
      const maxThumbPosition = trackHeight - thumbHeight

      setThumbPosition(scrollRatio * maxThumbPosition)
    }

    // Recalculate when window resizes
    const handleResize = () => {
      calculateThumbHeight()
      handleScroll()
    }

    containerRef.current.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)

    return () => {
      containerRef.current?.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [containerRef, thumbHeight, isDragging])

  // Handle thumb dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollbarRef.current || !containerRef.current || !thumbRef.current) return

      const track = scrollbarRef.current
      const container = containerRef.current

      // Calculate new position within track bounds
      const trackRect = track.getBoundingClientRect()
      const thumbOffset = thumbHeight / 2

      let newPosition = e.clientY - trackRect.top - thumbOffset
      newPosition = Math.max(0, Math.min(newPosition, track.clientHeight - thumbHeight))

      // Update thumb position
      setThumbPosition(newPosition)

      // Calculate and set container scroll position
      const scrollRatio = newPosition / (track.clientHeight - thumbHeight)
      const scrollPosition = scrollRatio * (container.scrollHeight - container.clientHeight)
      container.scrollTop = scrollPosition
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, thumbHeight, containerRef])

  // Handle mouse down on thumb
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  // Handle track click to jump to position
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!scrollbarRef.current || !containerRef.current || e.target !== scrollbarRef.current) return

    const track = scrollbarRef.current
    const container = containerRef.current
    const trackRect = track.getBoundingClientRect()

    // Calculate click position relative to track
    const clickPosition = e.clientY - trackRect.top
    const thumbOffset = thumbHeight / 2

    // Calculate new thumb position
    let newPosition = clickPosition - thumbOffset
    newPosition = Math.max(0, Math.min(newPosition, track.clientHeight - thumbHeight))

    // Update thumb position
    setThumbPosition(newPosition)

    // Calculate and set container scroll position
    const scrollRatio = newPosition / (track.clientHeight - thumbHeight)
    const scrollPosition = scrollRatio * (container.scrollHeight - container.clientHeight)
    container.scrollTop = scrollPosition
  }

  return (
    <div
      ref={scrollbarRef}
      onClick={handleTrackClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="custom-scrollbar"
      style={{
        position: "absolute",
        top: "10%",
        [position]: "6px",
        height,
        width,
        backgroundColor: trackColor,
        borderRadius: "4px",
        zIndex: 10,
        cursor: "pointer",
      }}
    >
      <div
        ref={thumbRef}
        onMouseDown={handleThumbMouseDown}
        className="custom-scrollbar-thumb"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translateY(${thumbPosition}px)`,
          height: `${thumbHeight}px`,
          width: "100%",
          background: isHovering || isDragging 
            ? "linear-gradient(to bottom, rgba(249, 115, 22, 0.9), rgba(234, 88, 12, 0.95))" 
            : "linear-gradient(to bottom, rgba(249, 115, 22, 0.6), rgba(234, 88, 12, 0.7))",
          boxShadow: isHovering || isDragging ? "0 0 8px rgba(249, 115, 22, 0.4)" : "none",
          borderRadius: "4px",
          transition: isDragging ? "none" : "all 0.2s ease",
          cursor: "grab",
        }}
      />
    </div>
  )
}
