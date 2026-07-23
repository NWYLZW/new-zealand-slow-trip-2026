import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import SearchIcon from "@mui/icons-material/Search";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VerifiedIcon from "@mui/icons-material/Verified";
import YouTubeIcon from "@mui/icons-material/YouTube";

const translatedPlatform = (platform, language) => (
  language === "en" && platform === "小红书" ? "Xiaohongshu" : platform
);

const platformIcon = (platform, isSearchEntry) => {
  if (isSearchEntry) return <SearchIcon />;
  if (platform === "YouTube") return <YouTubeIcon />;
  if (platform === "Facebook") return <FacebookIcon />;
  return <TravelExploreIcon />;
};

const localizedValue = (guide, field, language) => (
  language === "en" ? (guide[`${field}En`] ?? guide[field]) : guide[field]
);

const normalizeAuthor = (guide, language) => {
  const author = guide.author;
  if (!author) {
    return {
      avatar: guide.authorAvatar,
      handle: localizedValue(guide, "authorHandle", language),
      name: localizedValue(guide, "authorName", language),
    };
  }

  if (typeof author === "string") {
    return {
      avatar: guide.authorAvatar,
      handle: localizedValue(guide, "authorHandle", language),
      name: language === "en" ? (guide.authorEn ?? author) : author,
    };
  }

  return {
    avatar: author.avatar ?? guide.authorAvatar,
    handle: language === "en" ? (author.handleEn ?? author.handle) : author.handle,
    name: language === "en" ? (author.nameEn ?? author.name) : author.name,
  };
};

const normalizeMedia = (guide) => {
  const media = guide.media ?? {};
  const type = guide.mediaType ?? media.type ?? (guide.videoThumbnail ? "video" : undefined);
  const image = guide.videoThumbnail
    ?? guide.coverImage
    ?? guide.thumbnail
    ?? media.thumbnail
    ?? media.poster
    ?? (type !== "video" ? media.src : undefined);

  return {
    alt: guide.coverAlt ?? media.alt ?? guide.title,
    href: guide.mediaUrl ?? guide.videoUrl ?? media.url ?? guide.sourceUrl ?? guide.url,
    image,
    type,
  };
};

export function SocialGuideCard({ guide, language }) {
  const author = normalizeAuthor(guide, language);
  const media = normalizeMedia(guide);
  const platform = translatedPlatform(guide.platform, language);
  const sourceUrl = guide.sourceUrl ?? guide.url;
  const title = localizedValue(guide, "title", language);
  const excerpt = localizedValue(guide, "excerpt", language);
  const points = localizedValue(guide, "points", language) ?? [];
  const tip = localizedValue(guide, "tip", language);
  const isVerified = guide.verified === true || guide.isVerified === true;
  const stance = guide.stance ?? guide.sentiment;
  const stanceLabel = stance === "positive"
    ? (language === "en" ? "Worth referencing" : "值得参考")
    : stance === "pitfall"
      ? (language === "en" ? "Pitfall alert" : "避坑提醒")
      : null;

  return (
    <Card className={`route-social-guide-card${media.image ? " has-media" : ""}`} variant="outlined">
      {media.image && (
        <Box
          aria-label={media.type === "video"
            ? (language === "en" ? `Video: ${media.alt}` : `视频：${media.alt}`)
            : media.alt}
          className="route-social-guide-media"
          component={media.href ? "a" : "div"}
          href={media.href || undefined}
          rel={media.href ? "noreferrer" : undefined}
          target={media.href ? "_blank" : undefined}
        >
          <Box alt={media.alt} component="img" loading="lazy" src={media.image} />
          {media.type === "video" && (
            <Box className="route-social-guide-play">
              <PlayCircleFilledIcon />
              <Typography>{language === "en" ? "Video" : "视频"}</Typography>
            </Box>
          )}
        </Box>
      )}
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.75} className="route-social-guide-badges">
            <Chip
              icon={platformIcon(guide.platform, guide.isSearchEntry)}
              label={guide.isSearchEntry
                ? (language === "en" ? `${platform} search` : `${platform}搜索入口`)
                : platform}
              size="small"
            />
            {isVerified && (
              <Chip
                className="route-social-guide-verified"
                icon={<VerifiedIcon />}
                label={language === "en" ? "Source verified" : "来源已核验"}
                size="small"
              />
            )}
            {stanceLabel && (
              <Chip
                className={`route-social-guide-stance is-${stance}`}
                icon={stance === "positive" ? <ThumbUpAltOutlinedIcon /> : <WarningAmberIcon />}
                label={stanceLabel}
                size="small"
              />
            )}
            {media.type === "video" && !media.image && (
              <Chip
                className="route-social-guide-video-type"
                icon={<PlayCircleFilledIcon />}
                label={language === "en" ? "Video" : "视频"}
                size="small"
              />
            )}
          </Stack>
          <Typography className="route-social-guide-source">
            {language === "en" ? (guide.sourceEn ?? guide.source) : guide.source}
          </Typography>
        </Stack>

        {(author.name || author.handle || author.avatar) && (
          <Stack direction="row" alignItems="center" spacing={1} className="route-social-guide-author">
            {author.avatar && <Avatar alt={author.name || author.handle} src={author.avatar} />}
            <Box>
              {author.name && <Typography className="route-social-guide-author-name">{author.name}</Typography>}
              {author.handle && <Typography className="route-social-guide-author-handle">{author.handle}</Typography>}
            </Box>
          </Stack>
        )}

        <Typography variant="h4" className="route-social-guide-title">{title}</Typography>
        {excerpt && <Typography className="route-social-guide-excerpt">{excerpt}</Typography>}
        {points.length > 0 && (
          <Stack component="ul" spacing={0.5} className="route-social-guide-points">
            {points.map((point) => <Typography component="li" key={point}>{point}</Typography>)}
          </Stack>
        )}
        {tip && <Typography className="route-social-guide-tip">{tip}</Typography>}
        {sourceUrl && (
          <Button
            component="a"
            endIcon={<OpenInNewIcon />}
            href={sourceUrl}
            rel="noreferrer"
            target="_blank"
            variant="outlined"
          >
            {guide.isSearchEntry
              ? (language === "en" ? "Open search" : "打开搜索")
              : media.type === "video"
                ? (language === "en" ? "Watch video" : "观看视频")
                : (language === "en" ? "View post" : "查看原帖")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
