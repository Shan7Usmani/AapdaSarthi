"use client";

import { useEffect, useRef, useState } from "react";
import {
  Siren,
  MapPin,
  LocateFixed,
  Users,
  Mic,
  Square,
  ImagePlus,
  Video,
  Send,
  CheckCircle2,
  X,
  MessageSquareText,
  Radio,
} from "lucide-react";
import { useSosStore, type MediaAttachment } from "@/store/sos-store";
import { useOnline, getEffectiveOnline } from "@/store/connectivity";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMERGENCY_SMS_NUMBER =
  process.env.NEXT_PUBLIC_EMERGENCY_SMS_NUMBER ||
  "+91XXXXXXXXXX";

function readSavedLocation(): { lat: number; lng: number; accuracy?: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("aapda-saarthi-last-location");
    if (!saved) return null;
    const previous = JSON.parse(saved);
    if (typeof previous.lat === "number" && typeof previous.lng === "number") {
      return {
        lat: previous.lat,
        lng: previous.lng,
        accuracy: previous.accuracy,
      };
    }
  } catch {
    /* ignore invalid saved location */
  }
  return null;
}

export function SosComposer() {
  const addSos = useSosStore((s) => s.addSos);
  const isOnline = useOnline();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(
    readSavedLocation
  );
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">(() =>
    readSavedLocation() ? "ok" : "idle"
  );
  const [manualLat, setManualLat] = useState<number>(26.1);
  const [manualLng, setManualLng] = useState<number>(90.6);
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [sentId, setSentId] = useState<string | null>(null);
  const [routedTo, setRoutedTo] = useState<string | null>(null);

  const [deliveryMode, setDeliveryMode] =
    useState<"online" | "sms" | null>(null);

  // voice recording
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const addMedia = (m: MediaAttachment) => setMedia((prev) => [...prev, m]);

  const handleFiles = (kind: MediaAttachment["kind"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      addMedia({ kind, url: URL.createObjectURL(f), name: f.name });
    }
    e.target.value = "";
  };

  const removeMedia = (i: number) => {
    setMedia((prev) => {
      const url = prev[i]?.url;
      if (url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* noop */
        }
      }
      return prev.filter((_, j) => j !== i);
    });
  };

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      recorderRef.current?.stop();
      return;
    }
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          addMedia({ kind: "voice", url: URL.createObjectURL(blob), name: "voice-note.webm" });
        } finally {
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      setRecError("Microphone unavailable — check browser permissions and try again.");
    }
  };

const fetchLocation = () => {
  if (!("geolocation" in navigator)) {
    setLocStatus("error");
    console.error("Geolocation is not supported by this browser.");
    return;
  }

  setLocStatus("loading");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      console.log("Location received:", locationData);

      setLoc(locationData);
      setLocStatus("ok");

      localStorage.setItem(
        "aapda-saarthi-last-location",
        JSON.stringify({
          ...locationData,
          timestamp: Date.now(),
        })
      );
    },

    (error) => {
      console.error(
        "Location error:",
        error.code,
        error.message
      );

      // Try previously saved location.
      const saved = localStorage.getItem(
        "aapda-saarthi-last-location"
      );

      if (saved) {
        try {
          const previous = JSON.parse(saved);

          if (
            typeof previous.lat === "number" &&
            typeof previous.lng === "number"
          ) {
            setLoc({
              lat: previous.lat,
              lng: previous.lng,
              accuracy: previous.accuracy,
            });

            setLocStatus("ok");

            console.log(
              "Using previously saved location:",
              previous
            );

            return;
          }
        } catch {
          console.error(
            "Saved location is invalid."
          );
        }
      }

      setLocStatus("error");
    },

    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 300000,
    }
  );
};

  const useManualLocation = () => {
    setLoc({ lat: manualLat, lng: manualLng });
    setLocStatus("ok");
  };

  const canSubmit = message.trim().length > 0 && locStatus === "ok";

  const canReachServer = async (): Promise<boolean> => {
  if (!getEffectiveOnline()) {
    return false;
  }

  try {
    const response = await fetch(
      "/api/risk/connectivity",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    return response.ok;
  } catch {
    return false;
  }
};

  const sendSOSViaSMS = (sosId: string) => {
  let locationText = "Location unavailable";
  let mapText = "";

  if (loc) {
    locationText =
      `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;

    mapText =
      `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
  }

  const smsBody =
    `🚨 AAPDA SAARTHI SOS 🚨\n\n` +
    `SOS ID: ${sosId}\n` +
    `Name: ${name.trim() || "Anonymous citizen"}\n` +
    `People with me: ${peopleCount}\n\n` +
    `Emergency:\n${message.trim()}\n\n` +
    `Location: ${locationText}\n` +
    `${mapText ? `Map: ${mapText}\n\n` : "\n"}` +
    `Please send emergency assistance immediately.`;

  const smsUrl =
    `sms:${EMERGENCY_SMS_NUMBER}` +
    `?body=${encodeURIComponent(smsBody)}`;

  window.location.href = smsUrl;
};

const handleSubmit = async () => {
  if (!canSubmit) return;

  /*
   * FIRST:
   * Add the SOS to the existing Zustand store.
   *
   * Your store already persists to localStorage,
   * so this remains available even when offline.
   */
  const id = addSos({
    citizenName:
      name.trim() || "Anonymous citizen",

    message: message.trim(),

    peopleCount,

    location:
      loc ?? undefined,

    media,
  });

  /*
   * ------------------------------------------------
   * THIS IS THE IMPORTANT "AFTER addSos()" SECTION.
   * ------------------------------------------------
   */

  const created =
    useSosStore.getState().sos.find(
      (s) => s.id === id
    );

  setRoutedTo(
    created?.nearestRescuerName ?? null
  );

  /*
   * OFFLINE:
   *
   * The SOS is already safely stored locally.
   * Now prepare the cellular SMS.
   */
  const serverIsReachable =
  await canReachServer();

if (!serverIsReachable) {
  /*
   * INTERNET/SERVER UNAVAILABLE
   *
   * SOS has already been saved locally
   * by addSos().
   *
   * Now use cellular SMS.
   */
  setDeliveryMode("sms");
  setSentId(id);

  sendSOSViaSMS(id);

  return;
}

/*
 * SERVER IS REACHABLE
 *
 * SosSync will upload the SOS to Supabase.
 */
setDeliveryMode("online");
setSentId(id);
};

  useEffect(() => {
    return () => {
      setMedia([]);
    };
  }, []);

  if (sentId) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-safe" />

            {deliveryMode === "sms"
              ? "SOS prepared for SMS"
              : "SOS transmitted"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-safe/50 bg-safe/10 text-safe">
            <Siren className="h-7 w-7" />
          </div>
          <p className="text-sm text-foreground">
            Your distress signal{" "}
            <span className="font-mono text-cyan">
            {sentId}
            </span>{" "}
            {deliveryMode === "sms"
              ? "has been saved locally and the SMS composer has been opened."
              : "is now live."}
            </p>
          <p className="text-[12px] leading-relaxed text-muted">
            {deliveryMode === "sms" ? (
              <>
                Your SOS has been saved on this device and an
                emergency SMS has been prepared. Press{" "}
                <span className="font-semibold text-foreground">
                  Send
                </span>{" "}
                in your phone&apos;s messaging app to transmit
                it through the cellular network.
              </>
            ) : routedTo ? (
              <>
                Response has been routed to the nearest available
                team —{" "}
                <span className="font-semibold text-foreground">
                  {routedTo}
                </span>{" "}
                has been alerted and can take control of your
                situation.
              </>
            ) : (
              <>
                Rescue teams have been notified and can take
                control of your situation.
              </>
            )}
          </p>
          <Button variant="primary" size="md" onClick={() => setSentId(null)}>
            Send another SOS
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Siren className="h-3.5 w-3.5 text-danger" /> Citizen SOS
        </CardTitle>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
          <Radio className="h-3 w-3" />

          {isOnline
          ? "routed to nearest rescuer"
          : "offline · cellular SMS available"}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
            Your name (optional)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ritu Sharma"
            className="w-full rounded-md border border-border-strong bg-slate-50 px-3 py-2 text-[13px] text-foreground placeholder:text-muted/50 focus:border-cyan/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
            What&apos;s happening?
          </label>
          <div className="relative">
            <MessageSquareText className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-muted" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Water has entered our home and is rising fast. We are on the first floor and need rescue…"
              className="w-full resize-none rounded-md border border-border-strong bg-slate-50 py-2 pr-3 pl-8 text-[13px] text-foreground placeholder:text-muted/50 focus:border-cyan/60 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
            People with you
          </label>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setPeopleCount((n) => Math.max(1, n - 1))}>
              −
            </Button>
            <div className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-slate-50 py-2 font-mono text-sm">
              <Users className="h-3.5 w-3.5 text-cyan" />
              <span className="font-bold text-foreground">{peopleCount}</span>
              <span className="text-muted">person{peopleCount > 1 ? "s" : ""}</span>
            </div>
            <Button size="icon" variant="outline" onClick={() => setPeopleCount((n) => Math.min(50, n + 1))}>
              +
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
            Live location
          </label>
          <Button
            variant={locStatus === "ok" ? "primary" : "outline"}
            size="md"
            className="w-full"
            onClick={fetchLocation}
          >
            <LocateFixed className={cn("h-3.5 w-3.5", locStatus === "loading" && "blip")} />
            {locStatus === "ok"
              ? `${loc!.lat.toFixed(5)}, ${loc!.lng.toFixed(5)}`
              : locStatus === "loading"
                ? "Fetching location…"
                : "Fetch my exact location"}
          </Button>
          {locStatus === "error" && (
            <div className="mt-1 flex flex-col gap-1.5">
              <p className="font-mono text-[10px] text-danger">
                Location permission denied — enter coordinates below to transmit.
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.0001"
                  value={manualLat}
                  onChange={(e) => setManualLat(Number(e.target.value))}
                  className="w-full rounded-md border border-border-strong bg-slate-50 px-2 py-1.5 font-mono text-[12px] text-foreground focus:border-cyan/60 focus:outline-none"
                  aria-label="Manual latitude"
                />
                <span className="font-mono text-[10px] text-muted">lat</span>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLng}
                  onChange={(e) => setManualLng(Number(e.target.value))}
                  className="w-full rounded-md border border-border-strong bg-slate-50 px-2 py-1.5 font-mono text-[12px] text-foreground focus:border-cyan/60 focus:outline-none"
                  aria-label="Manual longitude"
                />
                <span className="font-mono text-[10px] text-muted">lng</span>
                <Button variant="outline" size="md" onClick={useManualLocation}>
                  Use
                </Button>
              </div>
            </div>
          )}
          {loc?.accuracy && (
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted">
              <MapPin className="h-3 w-3 text-cyan" /> accuracy ±{Math.round(loc.accuracy)}m
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
            Photo · video · voice
          </label>
          <div className="flex gap-2">
            <Button
              variant={recording ? "danger" : "outline"}
              size="md"
              className="flex-1"
              onClick={toggleRecording}
            >
              {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {recording ? "Stop & save" : "Record voice"}
            </Button>
            <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={handleFiles("photo")} />
            <Button variant="outline" size="icon" title="Attach photo" onClick={() => photoRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input ref={videoRef} type="file" accept="video/*" multiple hidden onChange={handleFiles("video")} />
            <Button variant="outline" size="icon" title="Attach video" onClick={() => videoRef.current?.click()}>
              <Video className="h-4 w-4" />
            </Button>
          </div>
          {recError && (
            <p className="mt-1 font-mono text-[10px] text-danger">{recError}</p>
          )}
        </div>

        {media.length > 0 && (
          <div className="flex flex-col gap-2">
            {media.map((m, i) => (
              <div key={`${m.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-panel-2/60 px-2 py-1.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-cyan/10 border border-cyan/30 text-cyan">
                  {m.kind === "photo" ? <ImagePlus className="h-3.5 w-3.5" /> : m.kind === "video" ? <Video className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </span>
                {m.kind === "photo" && (
                  <img src={m.url} alt="" className="h-9 w-12 shrink-0 rounded object-cover" />
                )}
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted">{m.name}</span>
                {m.kind === "voice" && <audio src={m.url} controls className="h-7 max-w-[110px]" />}
                {m.kind === "video" && <span className="font-mono text-[10px] text-muted">video ✓</span>}
                <button
                  onClick={() => removeMedia(i)}
                  className="text-muted hover:text-danger cursor-pointer"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant={canSubmit ? "primary" : "default"}
          size="lg"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full uppercase"
        >
          <Send className="h-4 w-4" /> Send SOS
        </Button>
        {!canSubmit ? (
          <p className="text-center font-mono text-[10px] text-muted">
            add a message + fetch location to transmit
          </p>
          ) : !isOnline ? (
          <p className="text-center font-mono text-[10px] text-danger">
            internet unavailable · SOS will use cellular SMS
          </p>
) : (
  <p className="text-center font-mono text-[10px] text-muted">
    SOS will be routed to the nearest available rescuer
  </p>
)}
      </CardContent>
    </Card>
  );
}
