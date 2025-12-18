# Intelligent Agenda-to-Minutes Conversion System Design

## Overview
This system transforms a static Agenda Template into a dynamic, structured Minutes of Meeting (MoM) document. It ensures meetings stay on track, governance rules are followed, and actionable outcomes are captured automatically.

## Core Workflow

1.  **Pre-Meeting**:
    *   Host selects an **Agenda Template** (or creates one).
    *   System instantiates **Meeting Agenda Items** linked to the meeting.
    *   Unfinished items from previous meetings (within the same series/context) are suggested for "Carry Forward".

2.  **In-Meeting (Real-time)**:
    *   **Active Agenda Tracking**: The UI highlights the current agenda item.
    *   **Timeline Tagging**: System records start/end timestamps for each agenda item (manual or voice-triggered).
    *   **Live Notes**: Participants can tag "Decision" or "Action Item" markers during the call.

3.  **Post-Meeting (Processing)**:
    *   **AI Transcription**: Convert audio to text.
    *   **Contextual Analysis**: AI analyzes transcript *segments* mapped to agenda items.
    *   **Extraction & Governance**:
        *   **Summarize**: Condensed discussion per item.
        *   **Enforce Conclusion**: Classify result as Decision, Action, Deferred, or Info.
        *   **Validate**: Check if "Action" has Owner + Deadline. Check if "Decision" has ownership.
    *   **Carry-Forward**: Mark unfinished items for the next meeting.

4.  **Review & Finalization**:
    *   Host reviews the generated MoM.
    *   Edit/Approve items.
    *   Finalize -> Distribute via Email -> Archive.

## Data Model Enhancements

### 1. `Meeting` (Update)
*   `template_id`: Link to the source template.
*   `status`: Scheduled, In-Progress, Processing, Review, Finalized.

### 2. `MeetingAgendaItem` (New)
*   Represents a specific topic in a specific meeting instance.
*   `title`, `description`, `allocated_duration`.
*   `actual_start_time`, `actual_duration`.
*   `status`: Pending, active, Completed, Deferred.
*   `decision_type`: Policy, Operational, Informational.
*   `outcome_summary`: Text summary of this distinct item.

### 3. `ActionItem` (New)
*   Specific tasks extracted from the meeting.
*   `description`, `owner_id`, `deadline`.
*   `status`: Open, In Progress, Done.

### 4. `Decision` (New)
*   Formal decisions recorded.
*   `description`, `type`, `impact`.

## AI Processing Logic (Prompt Engineering)

The AI will receive:
1.  **Agenda Structure** (List of items).
2.  **Transcript** (Ideally segmented by time if frontend tracked it, otherwise global).

**System Prompt Goal**:
> "Analyze the transcript based on the following Agenda. For each item, provide a summary, conclude the outcome (Decision/Action/Info), lists specific action items with owners, and flag if the agenda limit was exceeded."

## Governance Rules
*   **No Decision without Owner**: AI validates if a decision text implies responsibility and checks for an assigned person.
*   **No Agenda without Closure**: If an item has no clear ending in the transcript, AI marks it as "Deferred" or requests clarification.

## UI Flow
1.  **Schedule Page**: Select Template -> Edit Instance Agenda.
2.  **Meeting Room**: Sidebar shows Agenda. Active item highlighted. Button to "Next Item".
3.  **Minutes Page**: Structured view (Metadata -> Attendance -> Agenda 1 -> Agenda 2 -> Actions -> Decisions).
