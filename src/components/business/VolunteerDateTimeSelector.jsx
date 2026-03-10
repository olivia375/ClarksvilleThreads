import React, { useState, useCallback } from "react";
import { format, parse, addDays, isBefore, isAfter, isSameDay, startOfDay } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { integrations } from "@/api/gcpClient";
import { toast } from "sonner";
import {
  Clock,
  CalendarDays,
  Sparkles,
  X,
  GripVertical,
  Loader2,
  Plus,
} from "lucide-react";

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

function formatTime12h(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Tab 1: Time Selector — start and end time pickers
 */
function TimeSelector({ startTime, endTime, onStartTimeChange, onEndTimeChange }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Select start and end times for this opportunity.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Start Time</Label>
          <select
            value={startTime || ""}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {formatTime12h(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mb-2 block">End Time</Label>
          <select
            value={endTime || ""}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select time</option>
            {TIME_OPTIONS.filter((t) => !startTime || t > startTime).map((t) => (
              <option key={t} value={t}>
                {formatTime12h(t)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {startTime && endTime && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800 font-medium">
            {formatTime12h(startTime)} – {formatTime12h(endTime)}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Tab 2: Drag-and-drop Calendar — select dates visually, reorder them
 */
function DragDropCalendar({ selectedDates, onDatesChange }) {
  const today = startOfDay(new Date());

  const handleDayClick = (day) => {
    if (isBefore(day, today)) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const exists = selectedDates.find((d) => d === dateStr);
    if (exists) {
      onDatesChange(selectedDates.filter((d) => d !== dateStr));
    } else {
      onDatesChange([...selectedDates, dateStr].sort());
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedDates);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    onDatesChange(items);
  };

  const removeDate = (dateStr) => {
    onDatesChange(selectedDates.filter((d) => d !== dateStr));
  };

  const selectedDayObjects = selectedDates.map((d) => parse(d, "yyyy-MM-dd", new Date()));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Click dates on the calendar to select them. Drag to reorder priority.
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="border rounded-lg p-1 bg-white">
          <Calendar
            mode="multiple"
            selected={selectedDayObjects}
            onDayClick={handleDayClick}
            disabled={{ before: today }}
            className="rounded-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Label className="mb-2 block text-sm font-medium">
            Selected Dates ({selectedDates.length})
          </Label>
          {selectedDates.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No dates selected yet</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="dates">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-1.5 max-h-64 overflow-y-auto"
                  >
                    {selectedDates.map((dateStr, index) => (
                      <Draggable key={dateStr} draggableId={dateStr} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 rounded-md border text-sm ${
                              snapshot.isDragging
                                ? "bg-blue-50 border-blue-300 shadow-md"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <span
                              {...provided.dragHandleProps}
                              className="text-gray-400 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                            <span className="flex-1 font-medium text-gray-700">
                              {format(parse(dateStr, "yyyy-MM-dd", new Date()), "EEE, MMM d, yyyy")}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDate(dateStr)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tab 3: AI Text Parser — natural language to structured date/time
 */
function AITextParser({ onParsed }) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error("Please enter a schedule description.");
      return;
    }
    setIsParsing(true);
    setParsedResult(null);
    try {
      const prompt = `You are a scheduling assistant. Parse the following natural language schedule description into a structured JSON format. Today's date is ${format(new Date(), "yyyy-MM-dd")}.

Input: "${text.trim()}"

Return ONLY valid JSON with this structure (no other text):
{
  "schedule_type": "one_time" or "recurring",
  "dates": ["YYYY-MM-DD", ...],
  "recurring_days": [0-6 where 0=Sunday, ...] (only for recurring),
  "start_time": "HH:MM" (24h format, if mentioned),
  "end_time": "HH:MM" (24h format, if mentioned),
  "start_date": "YYYY-MM-DD" (only for recurring),
  "end_date": "YYYY-MM-DD" (only for recurring, if mentioned),
  "hours": number (estimated hours per session, if mentioned),
  "summary": "brief human-readable summary of what was parsed"
}

If no specific time is mentioned, omit start_time and end_time.
If specific dates are mentioned, list them in the dates array.
If a recurring pattern is described (e.g., "every Tuesday"), set schedule_type to "recurring" and fill recurring_days.`;

      const response = await integrations.Core.InvokeLLM({
        prompt,
        temperature: 0.1,
      });

      const responseText = response.response || response.text || response;
      let parsed;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = String(responseText).match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        toast.error("Could not parse the AI response. Please try rephrasing.");
        return;
      }

      setParsedResult(parsed);
    } catch (err) {
      toast.error(err.message || "Failed to parse schedule. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parsedResult) return;
    onParsed(parsedResult);
    toast.success("Schedule applied from AI parsing.");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Describe the schedule in plain English and we'll parse it automatically.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='e.g., "Every Tuesday and Thursday from 9am to 2pm starting March 20th" or "March 25th, 10:00 AM to 3:00 PM"'
        rows={3}
        className="resize-none"
      />
      <Button
        type="button"
        onClick={handleParse}
        disabled={isParsing || !text.trim()}
        className="bg-blue-900 hover:bg-blue-800"
      >
        {isParsing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Parsing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Parse with AI
          </>
        )}
      </Button>

      {parsedResult && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <p className="font-medium text-gray-900 text-sm">Parsed Result:</p>
          {parsedResult.summary && (
            <p className="text-sm text-gray-600">{parsedResult.summary}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {parsedResult.schedule_type === "recurring" ? "Recurring" : "One-time"}
            </Badge>
            {parsedResult.start_time && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                {formatTime12h(parsedResult.start_time)} – {formatTime12h(parsedResult.end_time)}
              </Badge>
            )}
            {parsedResult.dates?.length > 0 && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                {parsedResult.dates.length} date(s)
              </Badge>
            )}
            {parsedResult.recurring_days?.length > 0 && (
              <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                {parsedResult.recurring_days.map((d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")}
              </Badge>
            )}
            {parsedResult.hours && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {parsedResult.hours}h per session
              </Badge>
            )}
          </div>
          <Button
            type="button"
            onClick={handleApply}
            size="sm"
            className="bg-green-700 hover:bg-green-600 text-white"
          >
            Apply to Form
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Main component: three-tab datetime selector for volunteer opportunities
 */
export default function VolunteerDateTimeSelector({
  form,
  set,
  scheduleType,
}) {
  const handleStartTimeChange = (time) => {
    if (scheduleType === "one_time") {
      set("event_start_time", time);
    } else {
      set("recurring_start_time", time);
    }
  };

  const handleEndTimeChange = (time) => {
    if (scheduleType === "one_time") {
      set("event_end_time", time);
    } else {
      set("recurring_end_time", time);
    }
  };

  const startTime =
    scheduleType === "one_time" ? form.event_start_time : form.recurring_start_time;
  const endTime =
    scheduleType === "one_time" ? form.event_end_time : form.recurring_end_time;

  // For calendar tab: use event_date for one_time, or custom dates list
  const calendarDates =
    scheduleType === "one_time"
      ? form.event_date
        ? [form.event_date]
        : []
      : form.calendar_dates || [];

  const handleCalendarDatesChange = (dates) => {
    if (scheduleType === "one_time") {
      // For one-time, use the first (or latest) selected date
      set("event_date", dates.length > 0 ? dates[0] : "");
    } else {
      set("calendar_dates", dates);
    }
  };

  const handleAIParsed = (parsed) => {
    // Apply parsed result to form
    if (parsed.start_time) {
      handleStartTimeChange(parsed.start_time);
    }
    if (parsed.end_time) {
      handleEndTimeChange(parsed.end_time);
    }

    if (parsed.schedule_type === "one_time") {
      set("schedule_type", "one_time");
      if (parsed.dates?.length > 0) {
        set("event_date", parsed.dates[0]);
      }
      if (parsed.hours) {
        set("event_hours", Math.min(12, Math.max(1, parsed.hours)));
      }
    } else if (parsed.schedule_type === "recurring") {
      set("schedule_type", "recurring");
      if (parsed.recurring_days?.length > 0) {
        set("recurring_days", parsed.recurring_days);
      }
      if (parsed.start_date) {
        set("recurring_start_date", parsed.start_date);
      }
      if (parsed.end_date) {
        set("recurring_end_date", parsed.end_date);
      }
      if (parsed.hours) {
        set("recurring_hours_per_day", Math.min(12, Math.max(1, parsed.hours)));
      }
      if (parsed.dates?.length > 0) {
        set("calendar_dates", parsed.dates);
      }
    }
  };

  return (
    <div className="mt-4">
      <Label className="mb-3 block font-medium text-gray-900">
        Date & Time Selection
      </Label>
      <Tabs defaultValue="time" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time" className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Time Selector
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            AI Parse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4">
          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <DragDropCalendar
            selectedDates={calendarDates}
            onDatesChange={handleCalendarDatesChange}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AITextParser onParsed={handleAIParsed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { formatTime12h };
