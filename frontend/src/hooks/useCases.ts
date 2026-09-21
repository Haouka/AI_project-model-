import { useState, useEffect, useCallback } from "react";
import { CaseListItem, User } from "../types";
import { api } from "../api/client";

export function useCases(user: User | null) {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    active_cases: 0,
    needs_review: 0,
    completed: 0,
    high_priority: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const data = await api.listCases({
        status: statusFilter,
        document_type: docTypeFilter,
        search: searchTerm,
      });
      setCases(data.items);
      setDashboardStats({
        total: data.total,
        active_cases: data.active_cases,
        needs_review: data.needs_review,
        completed: data.completed,
        high_priority: data.high_priority,
      });
    } catch (e) {
      console.error("Failed to load cases", e);
    }
  }, [statusFilter, docTypeFilter, searchTerm]);

  useEffect(() => {
    if (user) {
      loadCases();
    }
  }, [user, loadCases]);

  const handleSeedDemo = useCallback(async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoCases();
      await loadCases();
    } catch (e) {
      console.error("Failed to seed demo cases", e);
    } finally {
      setIsSeeding(false);
    }
  }, [loadCases]);

  return {
    cases,
    dashboardStats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    docTypeFilter,
    setDocTypeFilter,
    isSeeding,
    loadCases,
    handleSeedDemo,
  };
}
