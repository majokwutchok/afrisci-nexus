import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CheckCircle, Users, Sparkles, ArrowRight, Calendar, ShieldCheck } from "lucide-react";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  past_due: "bg-orange-100 text-orange-700 border-orange-200",
  canceled: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-slate-200 text-slate-600 border-slate-300"
};

const formatDate = (s) => s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function InstitutionDashboard() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u) {
          const subs = await base44.entities.Subscription.filter({}, "-created_date", 50);
          setSubscriptions(subs || []);
          const orgs = await base44.entities.Organization.filter({ admin_user_id: u.id });
          setOrganizations(orgs || []);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-48 rounded-2xl mb-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <p className="text-slate-600 mb-4">Please sign in to view your institution dashboard.</p>
        <Button onClick={() => base44.auth.redirectToLogin(createPageUrl("InstitutionDashboard"))}>Sign in</Button>
      </div>
    );
  }

  const activeSub = subscriptions.find(s => s.status === "active");
  const ent = activeSub?.entitlements_snapshot || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SEO title="My Institution — AfriSci Nexus" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Institution Dashboard</h1>
        <p className="text-slate-600 mb-6">Manage your membership and view entitlements.</p>

        {subscriptions.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="pt-6">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No membership yet</h3>
              <p className="text-slate-600 mb-4">Subscribe your institution to unlock waived publishing for your researchers.</p>
              <Link to={createPageUrl("Memberships")}>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">Browse memberships <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-teal-600" />
                      {sub.plan_name || "Membership"}
                    </CardTitle>
                    <Badge className={STATUS_STYLE[sub.status] || "bg-slate-100 text-slate-700"}>{sub.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {sub.organization_name || "—"}</span>
                    {sub.seats > 0 && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {sub.seats} author slots</span>}
                    {sub.current_period_end && (
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Renews {formatDate(sub.current_period_end)}</span>
                    )}
                  </div>

                  {sub.status === "pending_payment" && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                      Payment pending — our team will issue an invoice and activate your membership once received.
                    </div>
                  )}

                  {sub.status === "active" && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Entitlements unlocked</p>
                      <div className="flex flex-wrap gap-2">
                        {ent.waived_publishing && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> Waived publishing</Badge>}
                        {ent.expedited_review && <Badge className="bg-teal-100 text-teal-700"><Sparkles className="w-3 h-3 mr-1" /> Expedited review</Badge>}
                        {ent.directory_analytics && <Badge className="bg-blue-100 text-blue-700">Directory analytics</Badge>}
                        {ent.data_subscription && <Badge className="bg-purple-100 text-purple-700">Data dashboards</Badge>}
                        {ent.author_slots > 0 && <Badge variant="secondary">{ent.author_slots} author slots</Badge>}
                        {ent.job_post_credits > 0 && <Badge variant="secondary">{ent.job_post_credits} job credits</Badge>}
                        {!ent.waived_publishing && !ent.expedited_review && !ent.directory_analytics && !ent.data_subscription && (
                          <span className="text-sm text-slate-500">Standard membership benefits</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {organizations.length > 0 && (
          <Card className="mt-6 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Your organization</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-1">
              <p><strong className="text-slate-800">{organizations[0].name}</strong> · {organizations[0].country || "—"}</p>
              {organizations[0].email_domains?.length > 0 && (
                <p>Affiliated domains: {organizations[0].email_domains.join(", ")}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}