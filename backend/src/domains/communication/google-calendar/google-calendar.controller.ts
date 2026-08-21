import { BadRequestException, Controller, Get, Post, Body, Query, Request, Res, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { GoogleCalendarService } from '@/domains/communication/google-calendar/google-calendar.service';

@Controller('google-calendar')
@ApiTags('Google Calendar Integration')
@ApiBearerAuth()
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);
  
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  /**
   * Helper to extract user ID from JWT payload
   */
  private getUserId(req: any): string {
    const userId = req.user?._id || req.user?.userId || req.user?.sub || req.user?.id;
    this.logger.debug(`[getUserId] Extracted userId: ${userId} from JWT: ${JSON.stringify(req.user)}`);
    return userId;
  }

  /**
   * Get Google OAuth authorization URL
   */
  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Google OAuth authorization URL',
    description: 'Get the URL to authorize Google Calendar access for the current user'
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authUrl: { type: 'string', example: 'https://accounts.google.com/oauth/authorize?...' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuthUrl(@Request() req): Promise<{ authUrl: string }> {
    const userId = this.getUserId(req);
    this.logger.log(`[getAuthUrl] Generating auth URL for user: ${userId}`);
    const authUrl = await this.googleCalendarService.getAuthUrl(userId);
    return { authUrl };
  }

  /**
   * Handle Google OAuth callback - PUBLIC endpoint (no JWT required)
   * This is called by Google's redirect, so we use the state parameter for user identification
   * Returns HTML page that signals result to parent window and auto-closes
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle Google OAuth callback (redirect from Google)',
    description: 'Exchange authorization code for access tokens - called by Google redirect'
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from Google',
    example: '4/0AX4XfWh...'
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter (user ID)',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Google Calendar connected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Google Calendar connected successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid code or failed to connect' })
  async handleCallbackGet(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ): Promise<void> {
    if (!code || !state) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Missing OAuth callback parameters' });
      return;
    }
    try {
      const result = await this.googleCalendarService.handleCallback(code, state);
      res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      this.logger.error(`[handleCallbackGet] Error: ${error.message}`);
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Failed to connect Google Calendar' });
    }
  }

  /**
   * Handle Google OAuth callback - POST endpoint for frontend to call with JWT
   */
  @Post('callback')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Google OAuth callback (from frontend)',
    description: 'Exchange authorization code for access tokens - called by frontend with JWT'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Authorization code from Google' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Google Calendar connected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Google Calendar connected successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid code or failed to connect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handleCallbackPost(
    @Body('code') code: string,
    @Request() req
  ): Promise<{ success: boolean; message: string }> {
    const userId = this.getUserId(req);
    this.logger.log(`[handleCallbackPost] Received callback with code: ${code?.substring(0, 10)}..., userId: ${userId}`);
    
    if (!code) {
      throw new Error('Missing authorization code');
    }
    
    throw new BadRequestException('OAuth callbacks must use the one-time authorization state flow');
  }

  /**
   * Get Google Calendar connection status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Google Calendar connection status',
    description: 'Check if the user has connected Google Calendar and if the connection is valid'
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean', example: true },
        hasValidAccess: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConnectionStatus(@Request() req): Promise<{ connected: boolean; hasValidAccess: boolean }> {
    const userId = this.getUserId(req);
    this.logger.debug(`[getConnectionStatus] Checking status for user: ${userId}`);
    return this.googleCalendarService.getConnectionStatus(userId);
  }

  /**
   * Disconnect Google Calendar
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disconnect Google Calendar',
    description: 'Remove Google Calendar access for the current user'
  })
  @ApiResponse({
    status: 200,
    description: 'Google Calendar disconnected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Google Calendar disconnected successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - failed to disconnect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async disconnectGoogleCalendar(@Request() req): Promise<{ success: boolean; message: string }> {
    const userId = this.getUserId(req);
    this.logger.log(`[disconnectGoogleCalendar] Disconnecting for user: ${userId}`);
    return this.googleCalendarService.disconnectGoogleCalendar(userId);
  }
}
